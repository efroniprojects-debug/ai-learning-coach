-- Additive migration: existing records remain available under Physics.
ALTER TABLE uploaded_files ADD COLUMN IF NOT EXISTS subject_id varchar(50) NOT NULL DEFAULT 'physics';
ALTER TABLE knowledge_chunks ADD COLUMN IF NOT EXISTS subject_id varchar(50) NOT NULL DEFAULT 'physics';
ALTER TABLE practice_attempts ADD COLUMN IF NOT EXISTS subject_id varchar(50) NOT NULL DEFAULT 'physics';
ALTER TABLE skill_mastery ADD COLUMN IF NOT EXISTS subject_id varchar(50) NOT NULL DEFAULT 'physics';
ALTER TABLE progress_snapshots ADD COLUMN IF NOT EXISTS subject_id varchar(50) NOT NULL DEFAULT 'physics';

CREATE INDEX IF NOT EXISTS uploaded_files_user_subject_idx ON uploaded_files(user_id, subject_id);
CREATE INDEX IF NOT EXISTS knowledge_chunks_subject_idx ON knowledge_chunks(subject_id);
CREATE INDEX IF NOT EXISTS practice_attempts_user_subject_idx ON practice_attempts(user_id, subject_id);

-- Mastery and daily snapshots must be unique inside a subject, not across all subjects.
DROP INDEX IF EXISTS skill_mastery_user_concept_idx;
CREATE UNIQUE INDEX IF NOT EXISTS skill_mastery_user_subject_concept_idx
  ON skill_mastery(user_id, subject_id, concept_id);

DROP INDEX IF EXISTS progress_snapshots_user_date_idx;
CREATE UNIQUE INDEX IF NOT EXISTS progress_snapshots_user_subject_date_idx
  ON progress_snapshots(user_id, subject_id, date);
