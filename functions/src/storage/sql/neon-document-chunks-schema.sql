-- Create extension for vector operations (if not already created)
CREATE EXTENSION IF NOT EXISTS vector;

-- Table to store document chunks for more granular embeddings
CREATE TABLE document_chunks (
  id SERIAL PRIMARY KEY,
  document_id VARCHAR(255) NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  product_id VARCHAR(255) NOT NULL,
  collection_id VARCHAR(255) NOT NULL,
  chunk_index INTEGER NOT NULL,
  total_chunks INTEGER NOT NULL,
  chunk_content TEXT NOT NULL,
  filename VARCHAR(255),
  file_url TEXT,
  chunk_keywords JSONB DEFAULT '[]',
  document_title VARCHAR(255),
  document_description TEXT,
  document_keywords JSONB DEFAULT '[]',
  collection_name VARCHAR(255),
  collection_description TEXT,
  collection_keywords JSONB DEFAULT '[]',
  embedding_vector VECTOR(1536), -- OpenAI text-embedding-3-small dimension
  embedding_model VARCHAR(255) NOT NULL,
  created_at BIGINT NOT NULL, -- Unix timestamp
  updated_at BIGINT NOT NULL, -- Unix timestamp
  UNIQUE(document_id, chunk_index)
);

-- Create indexes for faster querying
CREATE INDEX idx_document_chunks_document_id ON document_chunks(document_id);
CREATE INDEX idx_document_chunks_user_id ON document_chunks(user_id);
CREATE INDEX idx_document_chunks_product_id ON document_chunks(product_id);
CREATE INDEX idx_document_chunks_collection_id ON document_chunks(collection_id);
CREATE INDEX idx_document_chunks_created_at ON document_chunks(created_at);
CREATE INDEX idx_document_chunks_updated_at ON document_chunks(updated_at);

-- Create function for vector similarity search on chunks
CREATE OR REPLACE FUNCTION search_document_chunks(
  query_embedding VECTOR(1536),
  match_threshold FLOAT,
  match_count INT,
  user_id_filter VARCHAR DEFAULT NULL,
  product_id_filter VARCHAR DEFAULT NULL,
  collection_id_filter VARCHAR DEFAULT NULL,
  document_id_filter VARCHAR DEFAULT NULL
)
RETURNS TABLE (
  id INT,
  document_id VARCHAR,
  user_id VARCHAR,
  product_id VARCHAR,
  collection_id VARCHAR,
  chunk_index INTEGER,
  total_chunks INTEGER,
  chunk_content TEXT,
  filename VARCHAR,
  file_url TEXT,
  document_title VARCHAR,
  collection_name VARCHAR,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.document_id,
    c.user_id,
    c.product_id,
    c.collection_id,
    c.chunk_index,
    c.total_chunks,
    c.chunk_content,
    c.filename,
    c.file_url,
    c.document_title,
    c.collection_name,
    1 - (c.embedding_vector <-> query_embedding) AS similarity
  FROM
    document_chunks c
  WHERE
    (user_id_filter IS NULL OR c.user_id = user_id_filter) AND
    (product_id_filter IS NULL OR c.product_id = product_id_filter) AND
    (collection_id_filter IS NULL OR c.collection_id = collection_id_filter) AND
    (document_id_filter IS NULL OR c.document_id = document_id_filter) AND
    1 - (c.embedding_vector <-> query_embedding) > match_threshold
  ORDER BY
    similarity DESC
  LIMIT match_count;
END;
$$; 