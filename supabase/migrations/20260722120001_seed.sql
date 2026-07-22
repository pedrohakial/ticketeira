-- Seed de demonstração: mesmos eventos do MVP front-end.

insert into public.events (id, title, category, emoji, gradient, date, venue, city, organizer, description, featured, rating, reviews, created_at) values
('evt-aurora', 'Aurora Synthwave Live', 'Eletrônica', '🎛️', 'linear-gradient(135deg,#8b5cf6,#ec4899)', '2026-08-14T22:00:00-03:00', 'Audio Club', 'São Paulo, SP', 'Neon Nights Produções', 'Uma noite imersiva de synthwave com projeções 360°, lasers e os maiores nomes da cena retrô-futurista. Traga seus óculos neon.', true, 4.8, 231, '2026-06-01T12:00:00-03:00'),
('evt-maré', 'Maré Alta — Festival de Verão', 'Festival', '🌊', 'linear-gradient(135deg,#06b6d4,#3b82f6)', '2026-08-29T16:00:00-03:00', 'Praia do Forte', 'Salvador, BA', 'Onda Certa Eventos', 'Três palcos à beira-mar com axé, pop e eletrônica. Pôr do sol, food trucks e after party inclusos no ingresso.', true, 4.6, 512, '2026-05-20T12:00:00-03:00'),
('evt-veludo', 'Veludo — Noite de Jazz & Soul', 'Jazz', '🎷', 'linear-gradient(135deg,#f59e0b,#ef4444)', '2026-09-05T20:30:00-03:00', 'Teatro Bourbon', 'Curitiba, PR', 'Casa Veludo', 'Jantar + show em formato cabaré. Standards de jazz, soul brasileiro e uma seleção de vinhos premiada.', false, 4.9, 98, '2026-06-10T12:00:00-03:00'),
('evt-trovão', 'Trovão Elétrico — Rock in Club', 'Rock', '⚡', 'linear-gradient(135deg,#ef4444,#7f1d1d)', '2026-08-08T21:00:00-03:00', 'Hangar 677', 'Porto Alegre, RS', 'Sul Pesado Prod.', 'O retorno do Trovão Elétrico aos palcos depois de 5 anos. Repertório completo do álbum "Circuito" + clássicos.', false, 4.7, 187, '2026-04-15T12:00:00-03:00'),
('evt-luar', 'Luar do Sertão — Acústico', 'Sertanejo', '🌙', 'linear-gradient(135deg,#22c55e,#0d9488)', '2026-09-19T19:00:00-03:00', 'Arena Sertaneja', 'Goiânia, GO', 'Violada Shows', 'Modas de viola ao pôr do sol em formato acústico. Área kids, praça de alimentação e estacionamento incluso.', false, 4.5, 143, '2026-06-18T12:00:00-03:00'),
('evt-pixel', 'Pixel Beats — Games & Chiptune', 'Eletrônica', '👾', 'linear-gradient(135deg,#3b82f6,#8b5cf6)', '2026-10-03T18:00:00-03:00', 'Centro de Convenções', 'Belo Horizonte, MG', '8-Bit Collective', 'Festival de chiptune com freeplay de fliperamas, campeonato de retrogames e DJs tocando trilhas de videogame ao vivo.', false, 4.4, 76, '2026-06-25T12:00:00-03:00')
on conflict (id) do nothing;

insert into public.ticket_tiers (id, event_id, name, price, total, sold, position) values
('evt-aurora:pista', 'evt-aurora', 'Pista', 120, 500, 312, 0),
('evt-aurora:vip', 'evt-aurora', 'VIP (open bar)', 320, 120, 74, 1),
('evt-aurora:camarote', 'evt-aurora', 'Camarote', 580, 40, 21, 2),
('evt-maré:meia', 'evt-maré', 'Meia-entrada', 90, 800, 401, 0),
('evt-maré:inteira', 'evt-maré', 'Inteira', 180, 800, 366, 1),
('evt-maré:passaporte', 'evt-maré', 'Passaporte 2 dias', 300, 200, 88, 2),
('evt-veludo:plateia', 'evt-veludo', 'Plateia', 150, 220, 130, 0),
('evt-veludo:mesa', 'evt-veludo', 'Mesa p/ 2 + jantar', 420, 60, 33, 1),
('evt-trovão:pista', 'evt-trovão', 'Pista', 95, 700, 655, 0),
('evt-trovão:front', 'evt-trovão', 'Front stage', 190, 150, 150, 1),
('evt-luar:arquibancada', 'evt-luar', 'Arquibancada', 60, 1200, 402, 0),
('evt-luar:pista', 'evt-luar', 'Pista', 110, 900, 287, 1),
('evt-luar:camarote', 'evt-luar', 'Camarote família', 240, 80, 19, 2),
('evt-pixel:gamer', 'evt-pixel', 'Gamer', 75, 600, 210, 0),
('evt-pixel:pro', 'evt-pixel', 'Pro (campeonato)', 140, 128, 64, 1)
on conflict (id) do nothing;
