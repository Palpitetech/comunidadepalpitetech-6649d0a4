CREATE TEMP TABLE _users_to_delete ON COMMIT DROP AS
SELECT p.id
FROM perfis p
WHERE COALESCE(p.is_bot, false) = false
  AND NOT EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = p.id AND ur.role = 'admin'
  )
  AND NOT (
    p.status_assinatura = 'ativa'
    AND p.plan_id IN (
      SELECT id FROM plans
      WHERE slug IN ('mensal','anual','plano-anual-vip','semestral','palpites-lotofacil-grupo')
    )
  )
  AND (
    p.celular IS NULL
    OR p.celular = ''
    OR length(regexp_replace(p.celular, '\D', '', 'g')) < 12
    OR length(regexp_replace(p.celular, '\D', '', 'g')) > 13
    OR regexp_replace(p.celular, '\D', '', 'g') NOT LIKE '55%'
  );

-- Tabelas com FK NO ACTION precisam ser limpas explicitamente
DELETE FROM ai_usage_logs          WHERE user_id IN (SELECT id FROM _users_to_delete);
DELETE FROM bot_post_interactions  WHERE bot_perfil_id IN (SELECT id FROM _users_to_delete);
DELETE FROM bolao_resgates         WHERE user_id IN (SELECT id FROM _users_to_delete);
DELETE FROM saldo_transacoes       WHERE user_id IN (SELECT id FROM _users_to_delete);
DELETE FROM whatsapp_smart_links   WHERE created_by IN (SELECT id FROM _users_to_delete);
UPDATE admin_settings SET updated_by = NULL WHERE updated_by IN (SELECT id FROM _users_to_delete);

-- Outras tabelas user-facing (mesma lista do admin-delete-user)
DELETE FROM chat_messages          WHERE user_id IN (SELECT id FROM _users_to_delete);
DELETE FROM chat_daily_usage       WHERE user_id IN (SELECT id FROM _users_to_delete);
DELETE FROM chat_conversations     WHERE user_id IN (SELECT id FROM _users_to_delete);
DELETE FROM palpites_salvos        WHERE user_id IN (SELECT id FROM _users_to_delete);
DELETE FROM palpites_pastas        WHERE user_id IN (SELECT id FROM _users_to_delete);
DELETE FROM post_likes             WHERE user_id IN (SELECT id FROM _users_to_delete);
DELETE FROM post_comments          WHERE user_id IN (SELECT id FROM _users_to_delete);
DELETE FROM postagens              WHERE user_id IN (SELECT id FROM _users_to_delete);
DELETE FROM gerador_daily_usage    WHERE user_id IN (SELECT id FROM _users_to_delete);
DELETE FROM fechamento_auto_usage  WHERE user_id IN (SELECT id FROM _users_to_delete);
DELETE FROM codigos_verificacao    WHERE user_id IN (SELECT id FROM _users_to_delete);
DELETE FROM events                 WHERE user_id IN (SELECT id FROM _users_to_delete);
DELETE FROM referral_rewards       WHERE user_id IN (SELECT id FROM _users_to_delete);
DELETE FROM convites               WHERE referrer_id IN (SELECT id FROM _users_to_delete) OR referred_id IN (SELECT id FROM _users_to_delete);
DELETE FROM user_roles             WHERE user_id IN (SELECT id FROM _users_to_delete);
DELETE FROM perfis                 WHERE id IN (SELECT id FROM _users_to_delete);
DELETE FROM auth.users             WHERE id IN (SELECT id FROM _users_to_delete);