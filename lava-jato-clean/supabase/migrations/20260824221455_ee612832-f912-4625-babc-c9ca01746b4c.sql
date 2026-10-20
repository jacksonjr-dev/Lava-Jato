-- Esta migração antes removia permanentemente um tenant específico e todos os
-- seus dados. Ela foi neutralizada para que instalações novas e restaurações
-- nunca executem exclusões de dados de negócio durante uma migração de schema.
SELECT 1;
