-- WeBall — seed.sql
-- Cleveland, OH courts so the map isn't empty on first run.
--
-- NOTE: coordinates are approximate (street-address level). Before launch,
-- spot-check each pin in the Supabase dashboard or Google Maps and adjust.
-- st_point takes (lng, lat).

insert into public.courts
  (name, address, city, surface, indoor, lighting, hoops_count, amenities, verified, location)
values
  ('Abbey Park',
   '2149 W 18th St', 'Cleveland', 'concrete', false, false, 2,
   '{"parking": true}', true,
   extensions.st_point(-81.6907, 41.4809)::extensions.geography),

  ('Lincoln Park',
   '1201 Starkweather Ave (Tremont)', 'Cleveland', 'asphalt', false, true, 2,
   '{"water": true, "restrooms": true, "parking": true}', true,
   extensions.st_point(-81.6857, 41.4784)::extensions.geography),

  ('Cleveland Central Rec Center (outdoor courts)',
   '2526 Central Ave', 'Cleveland', 'concrete', false, true, 6,
   '{"water": true, "restrooms": true, "parking": true, "indoor_gym_nearby": true}', true,
   extensions.st_point(-81.6720, 41.4901)::extensions.geography),

  ('Greenwood Park',
   '2161 W 40th Pl', 'Cleveland', 'concrete', false, false, 4,
   '{}', true,
   extensions.st_point(-81.7096, 41.4795)::extensions.geography),

  ('Herman Park',
   'W 60th St & Herman Ave (Detroit-Shoreway)', 'Cleveland', 'concrete', false, false, 2,
   '{}', true,
   extensions.st_point(-81.7250, 41.4835)::extensions.geography),

  ('Trent Park',
   '3827 Trent Ave', 'Cleveland', 'asphalt', false, false, 2,
   '{"parking": true}', true,
   extensions.st_point(-81.7098, 41.4676)::extensions.geography),

  ('Luke Easter Park',
   'Dickens Ave & MLK Jr Dr', 'Cleveland', 'asphalt', false, true, 4,
   '{"restrooms": true, "parking": true}', true,
   extensions.st_point(-81.6090, 41.4680)::extensions.geography),

  ('Portland-Outhwaite Rec Center (outdoor courts)',
   '2511 E 46th St', 'Cleveland', 'concrete', false, true, 2,
   '{"water": true, "restrooms": true, "indoor_gym_nearby": true}', true,
   extensions.st_point(-81.6555, 41.4849)::extensions.geography),

  ('Morgana Park',
   '6840 Broadway Ave (Slavic Village)', 'Cleveland', 'asphalt', false, false, 2,
   '{"parking": true}', true,
   extensions.st_point(-81.6329, 41.4519)::extensions.geography),

  ('Cudell Recreation Center',
   '1910 West Blvd', 'Cleveland', 'hardwood', true, true, 2,
   '{"water": true, "restrooms": true, "parking": true}', true,
   extensions.st_point(-81.7405, 41.4770)::extensions.geography),

  ('Zelma George Recreation Center',
   '3155 Martin Luther King Jr Dr', 'Cleveland', 'hardwood', true, true, 2,
   '{"water": true, "restrooms": true, "parking": true}', true,
   extensions.st_point(-81.6018, 41.4826)::extensions.geography),

  ('Thurgood Marshall Recreation Center',
   '8611 Hough Ave', 'Cleveland', 'hardwood', true, true, 2,
   '{"water": true, "restrooms": true, "parking": true}', true,
   extensions.st_point(-81.6295, 41.5122)::extensions.geography),

  ('Halloran Park',
   '3550 W 117th St', 'Cleveland', 'asphalt', false, true, 2,
   '{"restrooms": true, "parking": true}', true,
   extensions.st_point(-81.7770, 41.4590)::extensions.geography),

  ('Michael J. Zone Recreation Center (outdoor courts)',
   '6301 Lorain Ave', 'Cleveland', 'sport-court', false, true, 2,
   '{"water": true, "restrooms": true, "parking": true, "indoor_gym_nearby": true}', true,
   extensions.st_point(-81.7290, 41.4694)::extensions.geography),

  ('Impett Park',
   '3207 W 153rd St (West Park)', 'Cleveland', 'asphalt', false, false, 2,
   '{"parking": true}', true,
   extensions.st_point(-81.8125, 41.4453)::extensions.geography),

  ('Kerruish Park',
   '17100 Harvard Ave', 'Cleveland', 'asphalt', false, false, 2,
   '{"parking": true}', true,
   extensions.st_point(-81.5560, 41.4419)::extensions.geography);
