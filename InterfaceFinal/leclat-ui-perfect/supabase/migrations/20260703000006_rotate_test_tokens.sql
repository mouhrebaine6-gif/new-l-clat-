-- ============================================================================
--  L'ÉCLAT — Migration correctrice 6 : rotation des tokens QR de test
--
--  POURQUOI :
--  Les 5 tokens seedés étaient courts (8 caractères) et prévisibles. Remplacés
--  par 128 bits d'aléa cryptographique au format canonique
--  "leclat:<fragment>:<32 hex>" (format lu par LeclatQrPayload côté Unity et
--  stocké tel quel dans public.tshirts.qr_token).
--  Les 5 t-shirts étaient non réclamés et scans était vide : rotation sans perte.
--  APPLIQUÉE au projet distant lwpzsqtyhskkcoutufjc le 2026-07-03.
--  ⚠️ Les nouveaux payloads doivent être ré-encodés dans les QR physiques :
--     SELECT fragment, qr_token FROM public.tshirts;
-- ============================================================================

update public.tshirts
set qr_token = 'leclat:' || fragment || ':' || encode(gen_random_bytes(16), 'hex')
where owner_device_id is null
  and qr_token like 'leclat:%';
