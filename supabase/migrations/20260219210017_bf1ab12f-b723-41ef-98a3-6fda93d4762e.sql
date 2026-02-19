
-- Desabilitar apenas o trigger de proteção (não system triggers)
ALTER TABLE perfis DISABLE TRIGGER prevent_subscription_changes;

-- Todos sem plano recebem Grátis
UPDATE perfis SET plan_id = '65f08789-debf-4e31-b182-7c73c2823b1b' WHERE plan_id IS NULL AND is_bot = false;

-- Atualizar ativos com plano mensal
UPDATE perfis SET plan_id = '96f56437-8582-4f53-aaee-e31103e5bcc8', status_assinatura = 'ativa' WHERE email IN ('jesusairton2020@gmail.com','rafael12lagni@gmail.com','nunesedmauro90123@gmail.com','dr.domingoscunha@gmail.com','paulino.moveisb@gmail.com','jonathanelisarocha@gmail.com','marcelodf2171@gmail.com','reginaldo_1975_psilva@hotmail.com','deeivid2010@hotmail.com','silvasalles612@gmail.com','diego7327@hotmail.com','kelytondourado@gmail.com','lucienelandimfurtado@outlook.com','ferreiradesusa57@gmail.com','ritapenha96@gmail.com','joaoalvessantosespiral@gmail.com','silvajuracy696@gmail.com','bibip1966@gmail.com');

-- Atualizar ativos com plano anual
UPDATE perfis SET plan_id = 'a1fc6ca2-cce2-41ef-aca4-4a2e8e60226f', status_assinatura = 'ativa' WHERE email IN ('lbaldarena@hotmail.com','profcajao13@gmail.com','alesaude@gmail.com','saxsergioluiz@hotmail.com','gn12101991.adv@gmail.com','josecarlosboiadeiro@gmail.com','quitelj4@gmail.com','capaglarin@gmail.com','denilson.resende91@gmail.com');

-- Atualizar ativos com plano semestral
UPDATE perfis SET plan_id = '54711fb1-5fe5-4094-8c8e-3f97e4921ea7', status_assinatura = 'ativa' WHERE email IN ('ualasdossantos440@gmail.com','sadabestueda@gmail.com');

-- Reabilitar o trigger
ALTER TABLE perfis ENABLE TRIGGER prevent_subscription_changes;
