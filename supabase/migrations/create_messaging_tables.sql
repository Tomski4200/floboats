-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  boat_id UUID REFERENCES boats(id) ON DELETE CASCADE,
  buyer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  buyer_last_read_at TIMESTAMP WITH TIME ZONE,
  seller_last_read_at TIMESTAMP WITH TIME ZONE,
  is_archived_by_buyer BOOLEAN DEFAULT false,
  is_archived_by_seller BOOLEAN DEFAULT false,
  UNIQUE(boat_id, buyer_id, seller_id)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  edited_at TIMESTAMP WITH TIME ZONE,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversations_buyer_id ON conversations(buyer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_seller_id ON conversations(seller_id);
CREATE INDEX IF NOT EXISTS idx_conversations_boat_id ON conversations(boat_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Conversations policies
-- Users can view conversations they're part of
CREATE POLICY "Users can view their conversations" ON conversations
FOR SELECT USING (
  auth.uid() = buyer_id OR auth.uid() = seller_id
);

-- Users can create conversations for boats (buyers initiating contact)
CREATE POLICY "Buyers can create conversations" ON conversations
FOR INSERT WITH CHECK (
  auth.uid() = buyer_id AND
  EXISTS (
    SELECT 1 FROM boats 
    WHERE boats.id = boat_id 
    AND boats.status = 'active'
    AND boats.owner_id != auth.uid() -- Can't message yourself
  )
);

-- Users can update conversations they're part of (for archiving, marking as read)
CREATE POLICY "Users can update their conversations" ON conversations
FOR UPDATE USING (
  auth.uid() = buyer_id OR auth.uid() = seller_id
);

-- Messages policies
-- Users can view messages in their conversations
CREATE POLICY "Users can view messages in their conversations" ON messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM conversations
    WHERE conversations.id = messages.conversation_id
    AND (conversations.buyer_id = auth.uid() OR conversations.seller_id = auth.uid())
  )
);

-- Users can send messages in their conversations
CREATE POLICY "Users can send messages in their conversations" ON messages
FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM conversations
    WHERE conversations.id = messages.conversation_id
    AND (conversations.buyer_id = auth.uid() OR conversations.seller_id = auth.uid())
  )
);

-- Users can update their own messages (for marking as read, editing)
CREATE POLICY "Users can update their own messages" ON messages
FOR UPDATE USING (
  auth.uid() = sender_id OR
  EXISTS (
    SELECT 1 FROM conversations
    WHERE conversations.id = messages.conversation_id
    AND (
      (conversations.buyer_id = auth.uid() AND messages.sender_id = conversations.seller_id) OR
      (conversations.seller_id = auth.uid() AND messages.sender_id = conversations.buyer_id)
    )
  )
);

-- Function to update conversation's last_message_at when a new message is sent
CREATE OR REPLACE FUNCTION update_conversation_last_message_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET last_message_at = NEW.created_at,
      updated_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update conversation's last_message_at
CREATE TRIGGER update_conversation_last_message_at_trigger
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION update_conversation_last_message_at();

-- Function to get unread message count for a user
CREATE OR REPLACE FUNCTION get_unread_message_count(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  unread_count INTEGER;
BEGIN
  SELECT COUNT(DISTINCT m.conversation_id)
  INTO unread_count
  FROM messages m
  JOIN conversations c ON c.id = m.conversation_id
  WHERE 
    m.is_read = false 
    AND m.sender_id != user_id
    AND (c.buyer_id = user_id OR c.seller_id = user_id)
    AND m.deleted_at IS NULL;
  
  RETURN unread_count;
END;
$$ LANGUAGE plpgsql;