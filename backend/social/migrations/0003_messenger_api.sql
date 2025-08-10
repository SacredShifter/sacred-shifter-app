-- Messenger API functions for Sacred Network
-- These functions provide the core messaging functionality

-- 1) Start a new thread with participants (including self)
CREATE OR REPLACE FUNCTION api_start_thread(p_member_ids uuid[], p_title text DEFAULT NULL)
RETURNS uuid 
LANGUAGE plpgsql 
SECURITY INVOKER 
AS $$
DECLARE 
  tid uuid; 
  me uuid := auth.uid(); 
  uid uuid;
BEGIN
  -- Create the thread
  INSERT INTO threads(is_group, created_by, title)
  VALUES (cardinality(p_member_ids) > 1, me, p_title)
  RETURNING id INTO tid;

  -- Add creator as owner
  INSERT INTO thread_members(thread_id, user_id, role) 
  VALUES (tid, me, 'owner');

  -- Add unique participants (excluding creator)
  FOREACH uid IN ARRAY p_member_ids LOOP
    IF uid <> me THEN
      INSERT INTO thread_members(thread_id, user_id, role) 
      VALUES (tid, uid, 'member')
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
  
  RETURN tid;
END$$;

-- 2) Add members to thread (owner/admin only)
CREATE OR REPLACE FUNCTION api_add_members(p_thread_id uuid, p_user_ids uuid[])
RETURNS void 
LANGUAGE plpgsql 
SECURITY INVOKER 
AS $$
DECLARE 
  me uuid := auth.uid(); 
  uid uuid;
BEGIN
  -- Check permissions
  IF NOT EXISTS(
    SELECT 1 FROM thread_members 
    WHERE thread_id = p_thread_id 
    AND user_id = me 
    AND role IN ('owner', 'admin')
  ) THEN
    RAISE EXCEPTION 'not permitted';
  END IF;
  
  -- Add each user
  FOREACH uid IN ARRAY p_user_ids LOOP
    INSERT INTO thread_members(thread_id, user_id, role) 
    VALUES (p_thread_id, uid, 'member')
    ON CONFLICT DO NOTHING;
  END LOOP;
END$$;

-- 3) Leave thread (self)
CREATE OR REPLACE FUNCTION api_leave_thread(p_thread_id uuid)
RETURNS void 
LANGUAGE plpgsql 
SECURITY INVOKER 
AS $$
BEGIN
  DELETE FROM thread_members 
  WHERE thread_id = p_thread_id 
  AND user_id = auth.uid();
END$$;

-- 4) Mark thread as read (updates last_read_at)
CREATE OR REPLACE FUNCTION api_mark_read(p_thread_id uuid)
RETURNS void 
LANGUAGE plpgsql 
SECURITY INVOKER 
AS $$
BEGIN
  UPDATE thread_members 
  SET last_read_at = NOW()
  WHERE thread_id = p_thread_id 
  AND user_id = auth.uid();
END$$;

-- 5) Rename thread (owner/admin only)
CREATE OR REPLACE FUNCTION api_rename_thread(p_thread_id uuid, p_title text)
RETURNS void 
LANGUAGE plpgsql 
SECURITY INVOKER 
AS $$
BEGIN
  -- Check permissions
  IF NOT EXISTS(
    SELECT 1 FROM thread_members 
    WHERE thread_id = p_thread_id 
    AND user_id = auth.uid() 
    AND role IN ('owner', 'admin')
  ) THEN
    RAISE EXCEPTION 'not permitted';
  END IF;
  
  UPDATE threads 
  SET title = p_title 
  WHERE id = p_thread_id;
END$$;

-- 6) Edit message (own messages only)
CREATE OR REPLACE FUNCTION api_edit_message(p_message_id uuid, p_body text, p_content jsonb DEFAULT NULL)
RETURNS void 
LANGUAGE plpgsql 
SECURITY INVOKER 
AS $$
BEGIN
  UPDATE messages 
  SET 
    body = p_body,
    content = COALESCE(p_content, content),
    edited_at = NOW()
  WHERE id = p_message_id 
  AND sender_id = auth.uid();
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'message not found or not owned by user';
  END IF;
END$$;

-- 7) Delete message (own messages only)
CREATE OR REPLACE FUNCTION api_delete_message(p_message_id uuid)
RETURNS void 
LANGUAGE plpgsql 
SECURITY INVOKER 
AS $$
BEGIN
  DELETE FROM messages 
  WHERE id = p_message_id 
  AND sender_id = auth.uid();
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'message not found or not owned by user';
  END IF;
END$$;

-- 8) Get thread with unread count
CREATE OR REPLACE FUNCTION api_get_threads_with_unread()
RETURNS TABLE(
  thread_id uuid,
  is_group boolean,
  title text,
  created_at timestamptz,
  last_message_id uuid,
  last_message_body text,
  last_message_created_at timestamptz,
  last_message_sender_id uuid,
  unread_count bigint,
  member_count bigint
) 
LANGUAGE plpgsql 
SECURITY INVOKER 
AS $$
DECLARE
  me uuid := auth.uid();
BEGIN
  RETURN QUERY
  SELECT 
    t.id as thread_id,
    t.is_group,
    t.title,
    t.created_at,
    lm.id as last_message_id,
    lm.body as last_message_body,
    lm.created_at as last_message_created_at,
    lm.sender_id as last_message_sender_id,
    COALESCE(unread.count, 0) as unread_count,
    member_counts.count as member_count
  FROM threads t
  INNER JOIN thread_members tm ON t.id = tm.thread_id AND tm.user_id = me
  LEFT JOIN LATERAL (
    SELECT id, body, created_at, sender_id
    FROM messages m
    WHERE m.thread_id = t.id
    ORDER BY m.created_at DESC
    LIMIT 1
  ) lm ON true
  LEFT JOIN LATERAL (
    SELECT COUNT(*) as count
    FROM messages m
    WHERE m.thread_id = t.id
    AND m.created_at > COALESCE(tm.last_read_at, '1970-01-01'::timestamptz)
  ) unread ON true
  LEFT JOIN LATERAL (
    SELECT COUNT(*) as count
    FROM thread_members tm2
    WHERE tm2.thread_id = t.id
  ) member_counts ON true
  ORDER BY COALESCE(lm.created_at, t.created_at) DESC;
END$$;

-- Create Aura bot user if it doesn't exist
DO $$
BEGIN
  -- This would typically be done through Supabase Auth, but for demo purposes
  -- we'll assume the Aura bot user exists with a known UUID
  -- In production, you'd create this through the Auth API
END$$;
