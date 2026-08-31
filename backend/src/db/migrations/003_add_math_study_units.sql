-- Additive and backwards-compatible: Physics remains the general track (0),
-- while existing Mathematics records are assigned to the former default, 5 units.
ALTER TABLE uploaded_files ADD COLUMN IF NOT EXISTS study_units integer NOT NULL DEFAULT 0;
ALTER TABLE knowledge_chunks ADD COLUMN IF NOT EXISTS study_units integer NOT NULL DEFAULT 0;
ALTER TABLE practice_attempts ADD COLUMN IF NOT EXISTS study_units integer NOT NULL DEFAULT 0;
ALTER TABLE skill_mastery ADD COLUMN IF NOT EXISTS study_units integer NOT NULL DEFAULT 0;
ALTER TABLE progress_snapshots ADD COLUMN IF NOT EXISTS study_units integer NOT NULL DEFAULT 0;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS study_units integer NOT NULL DEFAULT 0;

UPDATE uploaded_files SET study_units = 5 WHERE subject_id = 'math' AND study_units = 0;
UPDATE knowledge_chunks SET study_units = 5 WHERE subject_id = 'math' AND study_units = 0;
UPDATE practice_attempts SET study_units = 5 WHERE subject_id = 'math' AND study_units = 0;
UPDATE skill_mastery SET study_units = 5 WHERE subject_id = 'math' AND study_units = 0;
UPDATE progress_snapshots SET study_units = 5 WHERE subject_id = 'math' AND study_units = 0;
UPDATE conversations SET study_units = 5 WHERE subject = 'math' AND study_units = 0;

ALTER TABLE uploaded_files DROP CONSTRAINT IF EXISTS uploaded_files_study_units_check;
ALTER TABLE uploaded_files ADD CONSTRAINT uploaded_files_study_units_check CHECK (study_units IN (0, 3, 4, 5));
ALTER TABLE knowledge_chunks DROP CONSTRAINT IF EXISTS knowledge_chunks_study_units_check;
ALTER TABLE knowledge_chunks ADD CONSTRAINT knowledge_chunks_study_units_check CHECK (study_units IN (0, 3, 4, 5));
ALTER TABLE practice_attempts DROP CONSTRAINT IF EXISTS practice_attempts_study_units_check;
ALTER TABLE practice_attempts ADD CONSTRAINT practice_attempts_study_units_check CHECK (study_units IN (0, 3, 4, 5));
ALTER TABLE skill_mastery DROP CONSTRAINT IF EXISTS skill_mastery_study_units_check;
ALTER TABLE skill_mastery ADD CONSTRAINT skill_mastery_study_units_check CHECK (study_units IN (0, 3, 4, 5));
ALTER TABLE progress_snapshots DROP CONSTRAINT IF EXISTS progress_snapshots_study_units_check;
ALTER TABLE progress_snapshots ADD CONSTRAINT progress_snapshots_study_units_check CHECK (study_units IN (0, 3, 4, 5));
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_study_units_check;
ALTER TABLE conversations ADD CONSTRAINT conversations_study_units_check CHECK (study_units IN (0, 3, 4, 5));

DROP INDEX IF EXISTS skill_mastery_user_subject_concept_idx;
CREATE UNIQUE INDEX IF NOT EXISTS skill_mastery_user_subject_units_concept_idx
  ON skill_mastery(user_id, subject_id, study_units, concept_id);

DROP INDEX IF EXISTS progress_snapshots_user_subject_date_idx;
CREATE UNIQUE INDEX IF NOT EXISTS progress_snapshots_user_subject_units_date_idx
  ON progress_snapshots(user_id, subject_id, study_units, date);

CREATE INDEX IF NOT EXISTS uploaded_files_user_subject_units_idx ON uploaded_files(user_id, subject_id, study_units);
CREATE INDEX IF NOT EXISTS knowledge_chunks_subject_units_idx ON knowledge_chunks(subject_id, study_units);
CREATE INDEX IF NOT EXISTS practice_attempts_user_subject_units_idx ON practice_attempts(user_id, subject_id, study_units);

-- Cache extracted Drive text so Studio retries do not repeat expensive PDF OCR.
CREATE TABLE IF NOT EXISTS drive_text_cache (
  file_id varchar(255) PRIMARY KEY,
  subject_id varchar(50) NOT NULL,
  mime_type varchar(100) NOT NULL,
  source_modified_at timestamp,
  extracted_text text NOT NULL,
  updated_at timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS drive_text_cache_subject_idx ON drive_text_cache(subject_id);
