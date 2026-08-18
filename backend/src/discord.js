import { applicationConfig } from './config/config.js';

export const sendDiscordOrderNotification = async (customerOrderDetails) => {
  if (!applicationConfig.discordWebhookUrl) {
    return; // Do nothing if no webhook is configured
  }

  try {
    const {
      order_number: orderNumber,
      customer_name: customerName,
      customer_phone: customerPhone,
      delivery_type: deliveryType,
      address: deliveryAddress,
      total_amount: totalAmount,
      items: orderedItemsList
    } = customerOrderDetails;

    const groupedItemsMap = new Map();
    orderedItemsList.forEach(item => {
      if (!groupedItemsMap.has(item.menu_item_name)) {
        groupedItemsMap.set(item.menu_item_name, {
          menu_item_name: item.menu_item_name,
          quantity: 0,
          dressings: [],
          notes: []
        });
      }
      const g = groupedItemsMap.get(item.menu_item_name);
      g.quantity += parseInt(item.quantity, 10);
      if (item.dressing_name) {
        g.dressings.push(item.quantity > 1 ? `x${item.quantity} ${item.dressing_name}` : item.dressing_name);
      }
      if (item.item_notes) {
        g.notes.push(item.quantity > 1 ? `x${item.quantity} ${item.item_notes}` : item.item_notes);
      }
    });

    const formattedItemsDescription = Array.from(groupedItemsMap.values()).map(item => {
      let description = `**${item.menu_item_name}** x ${item.quantity}`;
      if (item.dressings.length > 0) {
        description += `\n ↳ ${item.dressings.join(', ')}`;
      }
      if (item.notes.length > 0) {
        description += `\n ↳ *${item.notes.join(', ')}*`;
      }
      return description;
    }).join('\n\n');

    const discordEmbedMessage = {
      title: `ออเดอร์ใหม่ #${orderNumber}`,
      color: 0x0ea5e9, // Clean modern blue
      description: `**ข้อมูลลูกค้า**\nชื่อ: ${customerName}\nโทร: ${customerPhone}\n\n**การรับสินค้า**\nรูปแบบ: ${deliveryType}${deliveryAddress ? `\nที่อยู่: ${deliveryAddress}` : ''}\n\n**รายการสินค้า**\n${formattedItemsDescription}\n\n**ยอดรวมทั้งสิ้น**\n\`${parseInt(totalAmount, 10)} บาท\``,
      timestamp: new Date().toISOString()
    };

    const webhookPayload = {
      embeds: [discordEmbedMessage]
    };

    const webhookUrl = `${applicationConfig.discordWebhookUrl}?wait=true`;
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(webhookPayload)
    });

    if (response.ok) {
      const data = await response.json();
      return data.id;
    }
  } catch (notificationError) {
    console.error('Error sending Discord notification:', notificationError);
  }
};

export const deleteDiscordOrderNotification = async (messageId, customerOrderDetails = null, canceledBy = null) => {
  if (!applicationConfig.discordWebhookUrl || !messageId) return;
  try {
    if (customerOrderDetails && canceledBy) {
      // Edit the original new order message to show it's cancelled
      const editUrl = `${applicationConfig.discordWebhookUrl}/messages/${messageId}`;
      const discordEmbedMessage = {
        title: `❌ ออเดอร์ #${customerOrderDetails.order_number} ถูกยกเลิก!`,
        color: 0xef4444, // Red
        description: `กำลังจะลบข้อความนี้ใน 5 วินาที...\n\n**ผู้ยกเลิก:** ${canceledBy}\n**เหตุผล:** ${customerOrderDetails.cancel_reason || 'ไม่ระบุ'}`
      };
      
      await fetch(editUrl, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embeds: [discordEmbedMessage] })
      });

      // Wait 5 seconds, then delete
      setTimeout(async () => {
        try {
          const deleteUrl = `${applicationConfig.discordWebhookUrl}/messages/${messageId}`;
          await fetch(deleteUrl, { method: 'DELETE' });
        } catch (error) {
          console.error('Error deleting delayed Discord message:', error);
        }
      }, 5000);
      
    } else {
      // Normal immediate delete
      const deleteUrl = `${applicationConfig.discordWebhookUrl}/messages/${messageId}`;
      await fetch(deleteUrl, { method: 'DELETE' });
    }
  } catch (error) {
    console.error('Error handling Discord message deletion:', error);
  }
};

export const sendDiscordCancelNotification = async (customerOrderDetails, canceledBy) => {
  if (!applicationConfig.discordCancelWebhookUrl) return;

  try {
    const {
      order_number: orderNumber,
      cancel_reason: cancelReason,
      items: orderedItemsList
    } = customerOrderDetails;

    const groupedItemsMap = new Map();
    orderedItemsList.forEach(item => {
      if (!groupedItemsMap.has(item.menu_item_name)) {
        groupedItemsMap.set(item.menu_item_name, {
          menu_item_name: item.menu_item_name,
          quantity: 0,
          dressings: [],
          notes: []
        });
      }
      const g = groupedItemsMap.get(item.menu_item_name);
      g.quantity += parseInt(item.quantity, 10);
      if (item.dressing_name) {
        g.dressings.push(item.quantity > 1 ? `x${item.quantity} ${item.dressing_name}` : item.dressing_name);
      }
      if (item.item_notes) {
        g.notes.push(item.quantity > 1 ? `x${item.quantity} ${item.item_notes}` : item.item_notes);
      }
    });

    const formattedItemsDescription = Array.from(groupedItemsMap.values()).map(item => {
      let description = `**${item.menu_item_name}** x ${item.quantity}`;
      if (item.dressings.length > 0) {
        description += `\n ↳ ${item.dressings.join(', ')}`;
      }
      if (item.notes.length > 0) {
        description += `\n ↳ *${item.notes.join(', ')}*`;
      }
      return description;
    }).join('\n\n');

    const discordEmbedMessage = {
      title: `ยกเลิกออเดอร์ #${orderNumber}`,
      color: 0xef4444, // Red
      description: `**ผู้ที่ทำการยกเลิก:** ${canceledBy}\n**เหตุผล:** ${cancelReason || 'ไม่ระบุ'}\n\n**รายการที่ถูกยกเลิก**\n${formattedItemsDescription}`,
      timestamp: new Date().toISOString()
    };

    const webhookPayload = { embeds: [discordEmbedMessage] };

    const webhookUrl = `${applicationConfig.discordCancelWebhookUrl}?wait=true`;
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(webhookPayload)
    });

    if (response.ok) {
      const data = await response.json();
      return data.id;
    }
  } catch (notificationError) {
    console.error('Error sending Discord cancel notification:', notificationError);
  }
};

export const sendDiscordDailySummary = async (sales, bestSellers, cancelledCount, ordersCount) => {
  if (!applicationConfig.discordReportWebhookUrl) return;

  try {
    const formattedBestSellers = bestSellers.length > 0
      ? bestSellers.map((item, index) => `${index + 1}. ${item.menu_item_name} (${item.total_quantity} รายการ)`).join('\n')
      : 'ไม่มีข้อมูล';

    const discordEmbedMessage = {
      title: `📊 สรุปยอดขายประจำวัน`,
      color: 0x10b981, // Emerald Green
      description: `**ยอดขายรวม:** \`${parseInt(sales, 10)} บาท\`\n**จำนวนออเดอร์:** ${ordersCount} ออเดอร์\n**จำนวนออเดอร์ที่ถูกยกเลิก:** ${cancelledCount} ออเดอร์\n\n**🔥 เมนูขายดี:**\n${formattedBestSellers}`,
      timestamp: new Date().toISOString()
    };

    const webhookPayload = { embeds: [discordEmbedMessage] };

    const webhookUrl = `${applicationConfig.discordReportWebhookUrl}?wait=true`;
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(webhookPayload)
    });

    if (response.ok) {
      const data = await response.json();
      return data.id;
    } else {
      throw new Error(`Discord API responded with status ${response.status}`);
    }
  } catch (error) {
    console.error('Error sending Discord daily summary:', error);
    throw error; // Re-throw to allow caller to rollback
  }
};
