-- Add atomic array operations for thread archiving
-- This prevents race conditions when multiple clients try to archive the same thread

-- Function to atomically append a value to an array column if not already present
CREATE OR REPLACE FUNCTION append_to_archived_by(
  thread_id_param UUID,
  user_id_param UUID
) RETURNS void AS $$
BEGIN
  UPDATE chat_threads
  SET archived_by = CASE
    WHEN user_id_param = ANY(archived_by) THEN archived_by
    ELSE array_append(archived_by, user_id_param)
  END
  WHERE id = thread_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to atomically remove a value from an array column
CREATE OR REPLACE FUNCTION remove_from_archived_by(
  thread_id_param UUID,
  user_id_param UUID
) RETURNS void AS $$
BEGIN
  UPDATE chat_threads
  SET archived_by = array_remove(archived_by, user_id_param)
  WHERE id = thread_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION append_to_archived_by(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION remove_from_archived_by(UUID, UUID) TO authenticated;
