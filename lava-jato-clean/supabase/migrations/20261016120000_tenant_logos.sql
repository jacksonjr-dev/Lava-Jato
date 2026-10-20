-- Logos dos lava-jatos: pasta pública (aparecem na área do cliente), separada da
-- pasta privada de fotos. O envio é feito pelo servidor (service role), depois
-- de conferir que o usuário é proprietário ou gerente e que o arquivo é uma
-- imagem PNG, JPEG ou WebP de até 1 MB (ver src/lib/logo.ts); por isso não há
-- policy de escrita para usuários.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('logos', 'logos', TRUE, 1048576, ARRAY['image/png', 'image/jpeg', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public = TRUE,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;
