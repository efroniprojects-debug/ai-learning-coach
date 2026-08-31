CREATE TABLE IF NOT EXISTS conversation_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(120) NOT NULL,
  created_at TIMESTAMP DEFAULT now() NOT NULL,
  updated_at TIMESTAMP DEFAULT now() NOT NULL,
  CONSTRAINT conversation_folders_user_name_unique UNIQUE (user_id, name)
);

CREATE INDEX IF NOT EXISTS conversation_folders_user_id_idx
  ON conversation_folders(user_id);

ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES conversation_folders(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS conversations_folder_id_idx
  ON conversations(folder_id);
