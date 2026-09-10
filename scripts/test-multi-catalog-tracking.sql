-- Every test write is rolled back. Execute as postgres; INSERT matrix runs as anon.
BEGIN;
SET LOCAL ROLE anon;
DO $test$
DECLARE accepted boolean;
BEGIN
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type,catalog_name) VALUES ('page_view','/leilao-martendal-weekend-2026',NULL,'01','Test animal','https://youtu.be/test','multi-catalog-test-0','Test','Desktop','WRONG CALLER NAME');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> true THEN RAISE EXCEPTION 'Case 0 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type,catalog_name) VALUES ('whatsapp_click','/leilao-martendal-weekend-2026',NULL,'01','Test animal','https://youtu.be/test','multi-catalog-test-1','Test','Desktop','WRONG CALLER NAME');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> true THEN RAISE EXCEPTION 'Case 1 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type,catalog_name) VALUES ('catalog_view','/leilao-martendal-weekend-2026',NULL,'01','Test animal','https://youtu.be/test','multi-catalog-test-2','Test','Desktop','WRONG CALLER NAME');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> false THEN RAISE EXCEPTION 'Case 2 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type,catalog_name) VALUES ('lot_view','/leilao-martendal-weekend-2026',NULL,'01','Test animal','https://youtu.be/test','multi-catalog-test-3','Test','Desktop','WRONG CALLER NAME');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> false THEN RAISE EXCEPTION 'Case 3 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type,catalog_name) VALUES ('lot_whatsapp_click','/leilao-martendal-weekend-2026',NULL,'01','Test animal','https://youtu.be/test','multi-catalog-test-4','Test','Desktop','WRONG CALLER NAME');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> false THEN RAISE EXCEPTION 'Case 4 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type,catalog_name) VALUES ('catalog_whatsapp_click','/leilao-martendal-weekend-2026',NULL,'01','Test animal','https://youtu.be/test','multi-catalog-test-5','Test','Desktop','WRONG CALLER NAME');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> false THEN RAISE EXCEPTION 'Case 5 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type,catalog_name) VALUES ('catalog_video_click','/leilao-martendal-weekend-2026',NULL,'01','Test animal','https://youtu.be/test','multi-catalog-test-6','Test','Desktop','WRONG CALLER NAME');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> false THEN RAISE EXCEPTION 'Case 6 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type,catalog_name) VALUES ('pdf_download','/leilao-martendal-weekend-2026',NULL,'01','Test animal','https://youtu.be/test','multi-catalog-test-7','Test','Desktop','WRONG CALLER NAME');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> false THEN RAISE EXCEPTION 'Case 7 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type,catalog_name) VALUES ('catalog_selector_view','/leilao-martendal-weekend-2026',NULL,'01','Test animal','https://youtu.be/test','multi-catalog-test-8','Test','Desktop','WRONG CALLER NAME');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> false THEN RAISE EXCEPTION 'Case 8 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type,catalog_name) VALUES ('catalog_selected','/leilao-martendal-weekend-2026','machos','01','Test animal','https://youtu.be/test','multi-catalog-test-9','Test','Desktop','WRONG CALLER NAME');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> false THEN RAISE EXCEPTION 'Case 9 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type,catalog_name) VALUES ('page_view','/catalago/leilao-martendal-weekend-2026',NULL,'01','Test animal','https://youtu.be/test','multi-catalog-test-10','Test','Desktop','WRONG CALLER NAME');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> false THEN RAISE EXCEPTION 'Case 10 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type,catalog_name) VALUES ('whatsapp_click','/catalago/leilao-martendal-weekend-2026',NULL,'01','Test animal','https://youtu.be/test','multi-catalog-test-11','Test','Desktop','WRONG CALLER NAME');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> false THEN RAISE EXCEPTION 'Case 11 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type,catalog_name) VALUES ('catalog_view','/catalago/leilao-martendal-weekend-2026',NULL,'01','Test animal','https://youtu.be/test','multi-catalog-test-12','Test','Desktop','WRONG CALLER NAME');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> false THEN RAISE EXCEPTION 'Case 12 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type,catalog_name) VALUES ('lot_view','/catalago/leilao-martendal-weekend-2026',NULL,'01','Test animal','https://youtu.be/test','multi-catalog-test-13','Test','Desktop','WRONG CALLER NAME');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> false THEN RAISE EXCEPTION 'Case 13 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type,catalog_name) VALUES ('lot_whatsapp_click','/catalago/leilao-martendal-weekend-2026',NULL,'01','Test animal','https://youtu.be/test','multi-catalog-test-14','Test','Desktop','WRONG CALLER NAME');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> false THEN RAISE EXCEPTION 'Case 14 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type,catalog_name) VALUES ('catalog_whatsapp_click','/catalago/leilao-martendal-weekend-2026',NULL,'01','Test animal','https://youtu.be/test','multi-catalog-test-15','Test','Desktop','WRONG CALLER NAME');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> false THEN RAISE EXCEPTION 'Case 15 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type,catalog_name) VALUES ('catalog_video_click','/catalago/leilao-martendal-weekend-2026',NULL,'01','Test animal','https://youtu.be/test','multi-catalog-test-16','Test','Desktop','WRONG CALLER NAME');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> false THEN RAISE EXCEPTION 'Case 16 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type,catalog_name) VALUES ('pdf_download','/catalago/leilao-martendal-weekend-2026',NULL,'01','Test animal','https://youtu.be/test','multi-catalog-test-17','Test','Desktop','WRONG CALLER NAME');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> false THEN RAISE EXCEPTION 'Case 17 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type,catalog_name) VALUES ('catalog_selector_view','/catalago/leilao-martendal-weekend-2026',NULL,'01','Test animal','https://youtu.be/test','multi-catalog-test-18','Test','Desktop','WRONG CALLER NAME');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> true THEN RAISE EXCEPTION 'Case 18 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type,catalog_name) VALUES ('catalog_selected','/catalago/leilao-martendal-weekend-2026','machos','01','Test animal','https://youtu.be/test','multi-catalog-test-19','Test','Desktop','WRONG CALLER NAME');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> true THEN RAISE EXCEPTION 'Case 19 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type,catalog_name) VALUES ('page_view','/catalago/leilao-martendal-weekend-2026/machos',NULL,'01','Test animal','https://youtu.be/test','multi-catalog-test-20','Test','Desktop','WRONG CALLER NAME');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> false THEN RAISE EXCEPTION 'Case 20 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type,catalog_name) VALUES ('whatsapp_click','/catalago/leilao-martendal-weekend-2026/machos',NULL,'01','Test animal','https://youtu.be/test','multi-catalog-test-21','Test','Desktop','WRONG CALLER NAME');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> false THEN RAISE EXCEPTION 'Case 21 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type,catalog_name) VALUES ('catalog_view','/catalago/leilao-martendal-weekend-2026/machos',NULL,'01','Test animal','https://youtu.be/test','multi-catalog-test-22','Test','Desktop','WRONG CALLER NAME');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> true THEN RAISE EXCEPTION 'Case 22 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type,catalog_name) VALUES ('lot_view','/catalago/leilao-martendal-weekend-2026/machos',NULL,'01','Test animal','https://youtu.be/test','multi-catalog-test-23','Test','Desktop','WRONG CALLER NAME');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> true THEN RAISE EXCEPTION 'Case 23 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type,catalog_name) VALUES ('lot_whatsapp_click','/catalago/leilao-martendal-weekend-2026/machos',NULL,'01','Test animal','https://youtu.be/test','multi-catalog-test-24','Test','Desktop','WRONG CALLER NAME');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> true THEN RAISE EXCEPTION 'Case 24 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type,catalog_name) VALUES ('catalog_whatsapp_click','/catalago/leilao-martendal-weekend-2026/machos',NULL,'01','Test animal','https://youtu.be/test','multi-catalog-test-25','Test','Desktop','WRONG CALLER NAME');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> true THEN RAISE EXCEPTION 'Case 25 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type,catalog_name) VALUES ('catalog_video_click','/catalago/leilao-martendal-weekend-2026/machos',NULL,'01','Test animal','https://youtu.be/test','multi-catalog-test-26','Test','Desktop','WRONG CALLER NAME');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> true THEN RAISE EXCEPTION 'Case 26 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type,catalog_name) VALUES ('pdf_download','/catalago/leilao-martendal-weekend-2026/machos',NULL,'01','Test animal','https://youtu.be/test','multi-catalog-test-27','Test','Desktop','WRONG CALLER NAME');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> true THEN RAISE EXCEPTION 'Case 27 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type,catalog_name) VALUES ('catalog_selector_view','/catalago/leilao-martendal-weekend-2026/machos',NULL,'01','Test animal','https://youtu.be/test','multi-catalog-test-28','Test','Desktop','WRONG CALLER NAME');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> false THEN RAISE EXCEPTION 'Case 28 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type,catalog_name) VALUES ('catalog_selected','/catalago/leilao-martendal-weekend-2026/machos','machos','01','Test animal','https://youtu.be/test','multi-catalog-test-29','Test','Desktop','WRONG CALLER NAME');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> false THEN RAISE EXCEPTION 'Case 29 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type,catalog_name) VALUES ('page_view','/catalago/leilao-martendal-weekend-2026/femeas',NULL,'01','Test animal','https://youtu.be/test','multi-catalog-test-30','Test','Desktop','WRONG CALLER NAME');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> false THEN RAISE EXCEPTION 'Case 30 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type,catalog_name) VALUES ('whatsapp_click','/catalago/leilao-martendal-weekend-2026/femeas',NULL,'01','Test animal','https://youtu.be/test','multi-catalog-test-31','Test','Desktop','WRONG CALLER NAME');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> false THEN RAISE EXCEPTION 'Case 31 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type,catalog_name) VALUES ('catalog_view','/catalago/leilao-martendal-weekend-2026/femeas',NULL,'01','Test animal','https://youtu.be/test','multi-catalog-test-32','Test','Desktop','WRONG CALLER NAME');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> true THEN RAISE EXCEPTION 'Case 32 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type,catalog_name) VALUES ('lot_view','/catalago/leilao-martendal-weekend-2026/femeas',NULL,'01','Test animal','https://youtu.be/test','multi-catalog-test-33','Test','Desktop','WRONG CALLER NAME');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> true THEN RAISE EXCEPTION 'Case 33 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type,catalog_name) VALUES ('lot_whatsapp_click','/catalago/leilao-martendal-weekend-2026/femeas',NULL,'01','Test animal','https://youtu.be/test','multi-catalog-test-34','Test','Desktop','WRONG CALLER NAME');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> true THEN RAISE EXCEPTION 'Case 34 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type,catalog_name) VALUES ('catalog_whatsapp_click','/catalago/leilao-martendal-weekend-2026/femeas',NULL,'01','Test animal','https://youtu.be/test','multi-catalog-test-35','Test','Desktop','WRONG CALLER NAME');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> true THEN RAISE EXCEPTION 'Case 35 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type,catalog_name) VALUES ('catalog_video_click','/catalago/leilao-martendal-weekend-2026/femeas',NULL,'01','Test animal','https://youtu.be/test','multi-catalog-test-36','Test','Desktop','WRONG CALLER NAME');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> true THEN RAISE EXCEPTION 'Case 36 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type,catalog_name) VALUES ('pdf_download','/catalago/leilao-martendal-weekend-2026/femeas',NULL,'01','Test animal','https://youtu.be/test','multi-catalog-test-37','Test','Desktop','WRONG CALLER NAME');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> true THEN RAISE EXCEPTION 'Case 37 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type,catalog_name) VALUES ('catalog_selector_view','/catalago/leilao-martendal-weekend-2026/femeas',NULL,'01','Test animal','https://youtu.be/test','multi-catalog-test-38','Test','Desktop','WRONG CALLER NAME');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> false THEN RAISE EXCEPTION 'Case 38 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type,catalog_name) VALUES ('catalog_selected','/catalago/leilao-martendal-weekend-2026/femeas','machos','01','Test animal','https://youtu.be/test','multi-catalog-test-39','Test','Desktop','WRONG CALLER NAME');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> false THEN RAISE EXCEPTION 'Case 39 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type,catalog_name) VALUES ('page_view','/arbitrary',NULL,'01','Test animal','https://youtu.be/test','multi-catalog-test-40','Test','Desktop','WRONG CALLER NAME');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> false THEN RAISE EXCEPTION 'Case 40 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type,catalog_name) VALUES ('whatsapp_click','/arbitrary',NULL,'01','Test animal','https://youtu.be/test','multi-catalog-test-41','Test','Desktop','WRONG CALLER NAME');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> false THEN RAISE EXCEPTION 'Case 41 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type,catalog_name) VALUES ('catalog_view','/arbitrary',NULL,'01','Test animal','https://youtu.be/test','multi-catalog-test-42','Test','Desktop','WRONG CALLER NAME');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> false THEN RAISE EXCEPTION 'Case 42 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type,catalog_name) VALUES ('lot_view','/arbitrary',NULL,'01','Test animal','https://youtu.be/test','multi-catalog-test-43','Test','Desktop','WRONG CALLER NAME');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> false THEN RAISE EXCEPTION 'Case 43 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type,catalog_name) VALUES ('lot_whatsapp_click','/arbitrary',NULL,'01','Test animal','https://youtu.be/test','multi-catalog-test-44','Test','Desktop','WRONG CALLER NAME');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> false THEN RAISE EXCEPTION 'Case 44 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type,catalog_name) VALUES ('catalog_whatsapp_click','/arbitrary',NULL,'01','Test animal','https://youtu.be/test','multi-catalog-test-45','Test','Desktop','WRONG CALLER NAME');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> false THEN RAISE EXCEPTION 'Case 45 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type,catalog_name) VALUES ('catalog_video_click','/arbitrary',NULL,'01','Test animal','https://youtu.be/test','multi-catalog-test-46','Test','Desktop','WRONG CALLER NAME');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> false THEN RAISE EXCEPTION 'Case 46 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type,catalog_name) VALUES ('pdf_download','/arbitrary',NULL,'01','Test animal','https://youtu.be/test','multi-catalog-test-47','Test','Desktop','WRONG CALLER NAME');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> false THEN RAISE EXCEPTION 'Case 47 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type,catalog_name) VALUES ('catalog_selector_view','/arbitrary',NULL,'01','Test animal','https://youtu.be/test','multi-catalog-test-48','Test','Desktop','WRONG CALLER NAME');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> false THEN RAISE EXCEPTION 'Case 48 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type,catalog_name) VALUES ('catalog_selected','/arbitrary','machos','01','Test animal','https://youtu.be/test','multi-catalog-test-49','Test','Desktop','WRONG CALLER NAME');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> false THEN RAISE EXCEPTION 'Case 49 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type,catalog_name) VALUES ('catalog_selected','/catalago/leilao-martendal-weekend-2026',NULL,NULL,NULL,NULL,'multi-catalog-test-50','Test','Desktop','WRONG CALLER NAME');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> false THEN RAISE EXCEPTION 'Case 50 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type,catalog_name) VALUES ('catalog_selected','/catalago/leilao-martendal-weekend-2026','unknown',NULL,NULL,NULL,'multi-catalog-test-51','Test','Desktop','WRONG CALLER NAME');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> false THEN RAISE EXCEPTION 'Case 51 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type,catalog_name) VALUES ('catalog_selected','/catalago/leilao-martendal-weekend-2026','femeas',NULL,NULL,NULL,'multi-catalog-test-52','Test','Desktop','WRONG CALLER NAME');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> true THEN RAISE EXCEPTION 'Case 52 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type,catalog_name) VALUES ('lot_view','/catalago/leilao-martendal-weekend-2026/femeas',NULL,NULL,'Test animal','https://youtu.be/test','multi-catalog-test-53','Test','Desktop','WRONG CALLER NAME');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> false THEN RAISE EXCEPTION 'Case 53 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type,catalog_name) VALUES ('lot_view','/catalago/leilao-martendal-weekend-2026/femeas',NULL,'01',NULL,'https://youtu.be/test','multi-catalog-test-54','Test','Desktop','WRONG CALLER NAME');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> false THEN RAISE EXCEPTION 'Case 54 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type,catalog_name) VALUES ('catalog_video_click','/catalago/leilao-martendal-weekend-2026/femeas',NULL,'01','Test animal',NULL,'multi-catalog-test-55','Test','Desktop','WRONG CALLER NAME');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> false THEN RAISE EXCEPTION 'Case 55 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type,catalog_name) VALUES ('catalog_selector_view','/catalago/leilao-martendal-weekend-2026','machos','01','Test animal','https://youtu.be/test','multi-catalog-test-56','Test','Desktop','WRONG CALLER NAME');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> false THEN RAISE EXCEPTION 'Case 56 failed'; END IF;
END;
$test$;
RESET ROLE;
DO $test$ BEGIN IF EXISTS (SELECT FROM public.martendal_tracking_events WHERE session_id LIKE 'multi-catalog-test-%' AND (catalog_name IS DISTINCT FROM CASE WHEN landing_path LIKE '%/femeas' THEN 'Fêmeas Elite - Martendal Weekend 2026' WHEN landing_path LIKE '%/machos' THEN 'Quarto de Milha - Martendal Weekend 2026' ELSE NULL END)) THEN RAISE EXCEPTION 'Metadata derivation failed'; END IF; END; $test$;
SET LOCAL ROLE anon;
INSERT INTO public.martendal_tracking_events(event_type,landing_path,session_id,lot_number,horse_name,device_type,traffic_source) VALUES ('lot_view','/catalago/leilao-martendal-weekend-2026/machos','multi-catalog-test-dedup','01','Test','Desktop','Test'),('lot_view','/catalago/leilao-martendal-weekend-2026/femeas','multi-catalog-test-dedup','01','Test','Desktop','Test');
DO $test$ DECLARE duplicated boolean := false; BEGIN BEGIN INSERT INTO public.martendal_tracking_events(event_type,landing_path,session_id,lot_number,horse_name,device_type,traffic_source) VALUES ('lot_view','/catalago/leilao-martendal-weekend-2026/femeas','multi-catalog-test-dedup','01','Test','Desktop','Test'); EXCEPTION WHEN unique_violation THEN duplicated := true; END; IF NOT duplicated THEN RAISE EXCEPTION 'Duplicate accepted'; END IF; END; $test$;
RESET ROLE;
SELECT 'PASS: 57 matrix cases, metadata derivation, cross-catalog dedup; rollback follows' as result;
ROLLBACK;
