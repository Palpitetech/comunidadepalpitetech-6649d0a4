UPDATE plans SET gerador_max_per_day = 10 WHERE name IN ('Mensal', 'Semestral', 'Anual');
UPDATE plans SET gerador_max_per_day = 999 WHERE name = 'Plano Anual VIP';