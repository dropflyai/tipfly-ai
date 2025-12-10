// API functions for support tickets
import { supabase } from './supabase';

export interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category?: string;
  user_email?: string;
  user_name?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateSupportTicketRequest {
  subject: string;
  message: string;
  category?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

// Create a new support ticket
export const createSupportTicket = async (
  request: CreateSupportTicketRequest
): Promise<SupportTicket> => {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('User not authenticated');

  // Get user profile for additional info
  const { data: profile } = await supabase
    .from('users')
    .select('email, full_name')
    .eq('id', user.id)
    .single();

  const { data, error } = await supabase
    .from('support_tickets')
    .insert([{
      user_id: user.id,
      subject: request.subject,
      message: request.message,
      category: request.category,
      priority: request.priority || 'medium',
      user_email: profile?.email || user.email,
      user_name: profile?.full_name,
      status: 'open',
    }])
    .select()
    .single();

  if (error) throw error;

  // Send Discord notification
  if (data) {
    await sendDiscordNotification(data);
  }

  return data;
};

// Get all support tickets for the current user
export const getSupportTickets = async (): Promise<SupportTicket[]> => {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('support_tickets')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

// Get a single support ticket
export const getSupportTicket = async (id: string): Promise<SupportTicket> => {
  const { data, error } = await supabase
    .from('support_tickets')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
};

// Send Discord webhook notification
const sendDiscordNotification = async (ticket: SupportTicket) => {
  const discordWebhookUrl = process.env.EXPO_PUBLIC_DISCORD_WEBHOOK_URL;

  if (!discordWebhookUrl) {
    console.warn('Discord webhook URL not configured');
    return;
  }

  try {
    // Create mailto link for easy reply
    const mailtoLink = ticket.user_email
      ? `mailto:${ticket.user_email}?subject=Re: ${encodeURIComponent(ticket.subject)}`
      : 'N/A';

    const embed = {
      title: '🎫 New Support Ticket',
      color: 0x10b981, // Green color
      fields: [
        {
          name: '📋 Subject',
          value: ticket.subject,
          inline: false,
        },
        {
          name: '💬 Message',
          value: ticket.message.length > 1024
            ? ticket.message.substring(0, 1021) + '...'
            : ticket.message,
          inline: false,
        },
        {
          name: '👤 User',
          value: ticket.user_name || ticket.user_email || 'Unknown',
          inline: true,
        },
        {
          name: '📧 Email',
          value: ticket.user_email || 'N/A',
          inline: true,
        },
        {
          name: '🏷️ Category',
          value: ticket.category || 'General',
          inline: true,
        },
        {
          name: '⚠️ Priority',
          value: ticket.priority.toUpperCase(),
          inline: true,
        },
        {
          name: '🆔 Ticket ID',
          value: ticket.id,
          inline: false,
        },
        {
          name: '📮 Reply',
          value: ticket.user_email ? `[Click to Reply](${mailtoLink})` : 'No email provided',
          inline: false,
        },
      ],
      timestamp: new Date(ticket.created_at).toISOString(),
      footer: {
        text: 'TipFly AI Support',
      },
    };

    await fetch(discordWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        embeds: [embed],
      }),
    });
  } catch (error) {
    console.error('Error sending Discord notification:', error);
    // Don't throw - ticket was created successfully, notification is just a bonus
  }
};
