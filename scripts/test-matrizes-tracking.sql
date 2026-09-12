-- Standalone verification of the applied contract. All synthetic events roll back.
BEGIN;
-- Run inside a transaction after the candidate migration; always ROLLBACK.
SET LOCAL ROLE anon;
DO $test$
DECLARE accepted boolean;
BEGIN
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type) VALUES ('page_view','/leilao-martendal-weekend-2026',NULL,'01','Test animal','https://youtu.be/test','matrizes-contract-test-0','Test','Desktop');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> true THEN RAISE EXCEPTION 'Case 0 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type) VALUES ('whatsapp_click','/leilao-martendal-weekend-2026',NULL,'01','Test animal','https://youtu.be/test','matrizes-contract-test-1','Test','Desktop');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> true THEN RAISE EXCEPTION 'Case 1 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type) VALUES ('catalog_view','/leilao-martendal-weekend-2026',NULL,'01','Test animal','https://youtu.be/test','matrizes-contract-test-2','Test','Desktop');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> false THEN RAISE EXCEPTION 'Case 2 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type) VALUES ('lot_view','/leilao-martendal-weekend-2026',NULL,'01','Test animal','https://youtu.be/test','matrizes-contract-test-3','Test','Desktop');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> false THEN RAISE EXCEPTION 'Case 3 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type) VALUES ('lot_whatsapp_click','/leilao-martendal-weekend-2026',NULL,'01','Test animal','https://youtu.be/test','matrizes-contract-test-4','Test','Desktop');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> false THEN RAISE EXCEPTION 'Case 4 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type) VALUES ('catalog_whatsapp_click','/leilao-martendal-weekend-2026',NULL,'01','Test animal','https://youtu.be/test','matrizes-contract-test-5','Test','Desktop');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> false THEN RAISE EXCEPTION 'Case 5 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type) VALUES ('catalog_video_click','/leilao-martendal-weekend-2026',NULL,'01','Test animal','https://youtu.be/test','matrizes-contract-test-6','Test','Desktop');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> false THEN RAISE EXCEPTION 'Case 6 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type) VALUES ('pdf_download','/leilao-martendal-weekend-2026',NULL,'01','Test animal','https://youtu.be/test','matrizes-contract-test-7','Test','Desktop');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> false THEN RAISE EXCEPTION 'Case 7 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type) VALUES ('catalog_selector_view','/leilao-martendal-weekend-2026',NULL,'01','Test animal','https://youtu.be/test','matrizes-contract-test-8','Test','Desktop');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> false THEN RAISE EXCEPTION 'Case 8 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type) VALUES ('catalog_selected','/leilao-martendal-weekend-2026','machos','01','Test animal','https://youtu.be/test','matrizes-contract-test-9','Test','Desktop');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> false THEN RAISE EXCEPTION 'Case 9 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type) VALUES ('page_view','/catalago/leilao-martendal-weekend-2026',NULL,'01','Test animal','https://youtu.be/test','matrizes-contract-test-10','Test','Desktop');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> false THEN RAISE EXCEPTION 'Case 10 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type) VALUES ('whatsapp_click','/catalago/leilao-martendal-weekend-2026',NULL,'01','Test animal','https://youtu.be/test','matrizes-contract-test-11','Test','Desktop');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> false THEN RAISE EXCEPTION 'Case 11 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type) VALUES ('catalog_view','/catalago/leilao-martendal-weekend-2026',NULL,'01','Test animal','https://youtu.be/test','matrizes-contract-test-12','Test','Desktop');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> false THEN RAISE EXCEPTION 'Case 12 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type) VALUES ('lot_view','/catalago/leilao-martendal-weekend-2026',NULL,'01','Test animal','https://youtu.be/test','matrizes-contract-test-13','Test','Desktop');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> false THEN RAISE EXCEPTION 'Case 13 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type) VALUES ('lot_whatsapp_click','/catalago/leilao-martendal-weekend-2026',NULL,'01','Test animal','https://youtu.be/test','matrizes-contract-test-14','Test','Desktop');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> false THEN RAISE EXCEPTION 'Case 14 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type) VALUES ('catalog_whatsapp_click','/catalago/leilao-martendal-weekend-2026',NULL,'01','Test animal','https://youtu.be/test','matrizes-contract-test-15','Test','Desktop');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> false THEN RAISE EXCEPTION 'Case 15 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type) VALUES ('catalog_video_click','/catalago/leilao-martendal-weekend-2026',NULL,'01','Test animal','https://youtu.be/test','matrizes-contract-test-16','Test','Desktop');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> false THEN RAISE EXCEPTION 'Case 16 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type) VALUES ('pdf_download','/catalago/leilao-martendal-weekend-2026',NULL,'01','Test animal','https://youtu.be/test','matrizes-contract-test-17','Test','Desktop');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> false THEN RAISE EXCEPTION 'Case 17 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type) VALUES ('catalog_selector_view','/catalago/leilao-martendal-weekend-2026',NULL,'01','Test animal','https://youtu.be/test','matrizes-contract-test-18','Test','Desktop');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> true THEN RAISE EXCEPTION 'Case 18 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type) VALUES ('catalog_selected','/catalago/leilao-martendal-weekend-2026','machos','01','Test animal','https://youtu.be/test','matrizes-contract-test-19','Test','Desktop');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> true THEN RAISE EXCEPTION 'Case 19 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type) VALUES ('page_view','/catalago/leilao-martendal-weekend-2026/machos',NULL,'01','Test animal','https://youtu.be/test','matrizes-contract-test-20','Test','Desktop');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> false THEN RAISE EXCEPTION 'Case 20 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type) VALUES ('whatsapp_click','/catalago/leilao-martendal-weekend-2026/machos',NULL,'01','Test animal','https://youtu.be/test','matrizes-contract-test-21','Test','Desktop');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> false THEN RAISE EXCEPTION 'Case 21 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type) VALUES ('catalog_view','/catalago/leilao-martendal-weekend-2026/machos',NULL,'01','Test animal','https://youtu.be/test','matrizes-contract-test-22','Test','Desktop');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> true THEN RAISE EXCEPTION 'Case 22 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type) VALUES ('lot_view','/catalago/leilao-martendal-weekend-2026/machos',NULL,'01','Test animal','https://youtu.be/test','matrizes-contract-test-23','Test','Desktop');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> true THEN RAISE EXCEPTION 'Case 23 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type) VALUES ('lot_whatsapp_click','/catalago/leilao-martendal-weekend-2026/machos',NULL,'01','Test animal','https://youtu.be/test','matrizes-contract-test-24','Test','Desktop');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> true THEN RAISE EXCEPTION 'Case 24 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type) VALUES ('catalog_whatsapp_click','/catalago/leilao-martendal-weekend-2026/machos',NULL,'01','Test animal','https://youtu.be/test','matrizes-contract-test-25','Test','Desktop');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> true THEN RAISE EXCEPTION 'Case 25 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type) VALUES ('catalog_video_click','/catalago/leilao-martendal-weekend-2026/machos',NULL,'01','Test animal','https://youtu.be/test','matrizes-contract-test-26','Test','Desktop');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> true THEN RAISE EXCEPTION 'Case 26 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type) VALUES ('pdf_download','/catalago/leilao-martendal-weekend-2026/machos',NULL,'01','Test animal','https://youtu.be/test','matrizes-contract-test-27','Test','Desktop');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> true THEN RAISE EXCEPTION 'Case 27 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type) VALUES ('catalog_selector_view','/catalago/leilao-martendal-weekend-2026/machos',NULL,'01','Test animal','https://youtu.be/test','matrizes-contract-test-28','Test','Desktop');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> false THEN RAISE EXCEPTION 'Case 28 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type) VALUES ('catalog_selected','/catalago/leilao-martendal-weekend-2026/machos','machos','01','Test animal','https://youtu.be/test','matrizes-contract-test-29','Test','Desktop');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> false THEN RAISE EXCEPTION 'Case 29 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type) VALUES ('page_view','/catalago/leilao-martendal-weekend-2026/femeas',NULL,'01','Test animal','https://youtu.be/test','matrizes-contract-test-30','Test','Desktop');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> false THEN RAISE EXCEPTION 'Case 30 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type) VALUES ('whatsapp_click','/catalago/leilao-martendal-weekend-2026/femeas',NULL,'01','Test animal','https://youtu.be/test','matrizes-contract-test-31','Test','Desktop');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> false THEN RAISE EXCEPTION 'Case 31 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type) VALUES ('catalog_view','/catalago/leilao-martendal-weekend-2026/femeas',NULL,'01','Test animal','https://youtu.be/test','matrizes-contract-test-32','Test','Desktop');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> true THEN RAISE EXCEPTION 'Case 32 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type) VALUES ('lot_view','/catalago/leilao-martendal-weekend-2026/femeas',NULL,'01','Test animal','https://youtu.be/test','matrizes-contract-test-33','Test','Desktop');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> true THEN RAISE EXCEPTION 'Case 33 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type) VALUES ('lot_whatsapp_click','/catalago/leilao-martendal-weekend-2026/femeas',NULL,'01','Test animal','https://youtu.be/test','matrizes-contract-test-34','Test','Desktop');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> true THEN RAISE EXCEPTION 'Case 34 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type) VALUES ('catalog_whatsapp_click','/catalago/leilao-martendal-weekend-2026/femeas',NULL,'01','Test animal','https://youtu.be/test','matrizes-contract-test-35','Test','Desktop');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> true THEN RAISE EXCEPTION 'Case 35 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type) VALUES ('catalog_video_click','/catalago/leilao-martendal-weekend-2026/femeas',NULL,'01','Test animal','https://youtu.be/test','matrizes-contract-test-36','Test','Desktop');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> true THEN RAISE EXCEPTION 'Case 36 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type) VALUES ('pdf_download','/catalago/leilao-martendal-weekend-2026/femeas',NULL,'01','Test animal','https://youtu.be/test','matrizes-contract-test-37','Test','Desktop');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> true THEN RAISE EXCEPTION 'Case 37 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type) VALUES ('catalog_selector_view','/catalago/leilao-martendal-weekend-2026/femeas',NULL,'01','Test animal','https://youtu.be/test','matrizes-contract-test-38','Test','Desktop');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> false THEN RAISE EXCEPTION 'Case 38 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type) VALUES ('catalog_selected','/catalago/leilao-martendal-weekend-2026/femeas','machos','01','Test animal','https://youtu.be/test','matrizes-contract-test-39','Test','Desktop');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> false THEN RAISE EXCEPTION 'Case 39 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type) VALUES ('page_view','/arbitrary',NULL,'01','Test animal','https://youtu.be/test','matrizes-contract-test-40','Test','Desktop');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> false THEN RAISE EXCEPTION 'Case 40 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type) VALUES ('whatsapp_click','/arbitrary',NULL,'01','Test animal','https://youtu.be/test','matrizes-contract-test-41','Test','Desktop');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> false THEN RAISE EXCEPTION 'Case 41 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type) VALUES ('catalog_view','/arbitrary',NULL,'01','Test animal','https://youtu.be/test','matrizes-contract-test-42','Test','Desktop');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> false THEN RAISE EXCEPTION 'Case 42 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type) VALUES ('lot_view','/arbitrary',NULL,'01','Test animal','https://youtu.be/test','matrizes-contract-test-43','Test','Desktop');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> false THEN RAISE EXCEPTION 'Case 43 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type) VALUES ('lot_whatsapp_click','/arbitrary',NULL,'01','Test animal','https://youtu.be/test','matrizes-contract-test-44','Test','Desktop');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> false THEN RAISE EXCEPTION 'Case 44 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type) VALUES ('catalog_whatsapp_click','/arbitrary',NULL,'01','Test animal','https://youtu.be/test','matrizes-contract-test-45','Test','Desktop');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> false THEN RAISE EXCEPTION 'Case 45 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type) VALUES ('catalog_video_click','/arbitrary',NULL,'01','Test animal','https://youtu.be/test','matrizes-contract-test-46','Test','Desktop');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> false THEN RAISE EXCEPTION 'Case 46 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type) VALUES ('pdf_download','/arbitrary',NULL,'01','Test animal','https://youtu.be/test','matrizes-contract-test-47','Test','Desktop');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> false THEN RAISE EXCEPTION 'Case 47 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type) VALUES ('catalog_selector_view','/arbitrary',NULL,'01','Test animal','https://youtu.be/test','matrizes-contract-test-48','Test','Desktop');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> false THEN RAISE EXCEPTION 'Case 48 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type) VALUES ('catalog_selected','/arbitrary','machos','01','Test animal','https://youtu.be/test','matrizes-contract-test-49','Test','Desktop');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> false THEN RAISE EXCEPTION 'Case 49 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type) VALUES ('catalog_selected','/catalago/leilao-martendal-weekend-2026',NULL,NULL,NULL,NULL,'matrizes-contract-test-50','Test','Desktop');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> false THEN RAISE EXCEPTION 'Case 50 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type) VALUES ('catalog_selected','/catalago/leilao-martendal-weekend-2026','unknown',NULL,NULL,NULL,'matrizes-contract-test-51','Test','Desktop');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> false THEN RAISE EXCEPTION 'Case 51 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type) VALUES ('catalog_selected','/catalago/leilao-martendal-weekend-2026','femeas',NULL,NULL,NULL,'matrizes-contract-test-52','Test','Desktop');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> true THEN RAISE EXCEPTION 'Case 52 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type) VALUES ('lot_view','/catalago/leilao-martendal-weekend-2026/femeas',NULL,NULL,'Test animal','https://youtu.be/test','matrizes-contract-test-53','Test','Desktop');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> false THEN RAISE EXCEPTION 'Case 53 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type) VALUES ('lot_view','/catalago/leilao-martendal-weekend-2026/femeas',NULL,'01',NULL,'https://youtu.be/test','matrizes-contract-test-54','Test','Desktop');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> false THEN RAISE EXCEPTION 'Case 54 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type) VALUES ('catalog_video_click','/catalago/leilao-martendal-weekend-2026/femeas',NULL,'01','Test animal',NULL,'matrizes-contract-test-55','Test','Desktop');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> false THEN RAISE EXCEPTION 'Case 55 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type) VALUES ('catalog_selector_view','/catalago/leilao-martendal-weekend-2026','machos','01','Test animal','https://youtu.be/test','matrizes-contract-test-56','Test','Desktop');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> false THEN RAISE EXCEPTION 'Case 56 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type) VALUES ('page_view','/catalago/leilao-martendal-weekend-2026/matrizes','matrizes','102','Test animal','https://youtu.be/test','matrizes-contract-test-57','Test','Desktop');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> false THEN RAISE EXCEPTION 'Case 57 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type) VALUES ('whatsapp_click','/catalago/leilao-martendal-weekend-2026/matrizes','matrizes','102','Test animal','https://youtu.be/test','matrizes-contract-test-58','Test','Desktop');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> false THEN RAISE EXCEPTION 'Case 58 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type) VALUES ('catalog_view','/catalago/leilao-martendal-weekend-2026/matrizes','matrizes','102','Test animal','https://youtu.be/test','matrizes-contract-test-59','Test','Desktop');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> true THEN RAISE EXCEPTION 'Case 59 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type) VALUES ('lot_view','/catalago/leilao-martendal-weekend-2026/matrizes','matrizes','102','Test animal','https://youtu.be/test','matrizes-contract-test-60','Test','Desktop');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> true THEN RAISE EXCEPTION 'Case 60 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type) VALUES ('lot_whatsapp_click','/catalago/leilao-martendal-weekend-2026/matrizes','matrizes','102','Test animal','https://youtu.be/test','matrizes-contract-test-61','Test','Desktop');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> true THEN RAISE EXCEPTION 'Case 61 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type) VALUES ('catalog_whatsapp_click','/catalago/leilao-martendal-weekend-2026/matrizes','matrizes','102','Test animal','https://youtu.be/test','matrizes-contract-test-62','Test','Desktop');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> true THEN RAISE EXCEPTION 'Case 62 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type) VALUES ('catalog_video_click','/catalago/leilao-martendal-weekend-2026/matrizes','matrizes','102','Test animal','https://youtu.be/test','matrizes-contract-test-63','Test','Desktop');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> true THEN RAISE EXCEPTION 'Case 63 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type) VALUES ('pdf_download','/catalago/leilao-martendal-weekend-2026/matrizes','matrizes','102','Test animal','https://youtu.be/test','matrizes-contract-test-64','Test','Desktop');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> true THEN RAISE EXCEPTION 'Case 64 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type) VALUES ('catalog_selector_view','/catalago/leilao-martendal-weekend-2026/matrizes','matrizes','102','Test animal','https://youtu.be/test','matrizes-contract-test-65','Test','Desktop');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> false THEN RAISE EXCEPTION 'Case 65 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type) VALUES ('catalog_selected','/catalago/leilao-martendal-weekend-2026/matrizes','machos','102','Test animal','https://youtu.be/test','matrizes-contract-test-66','Test','Desktop');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> false THEN RAISE EXCEPTION 'Case 66 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type) VALUES ('lot_view','/catalago/leilao-martendal-weekend-2026/matrizes','matrizes',NULL,'Test animal','https://youtu.be/test','matrizes-contract-test-67','Test','Desktop');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> false THEN RAISE EXCEPTION 'Case 67 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type) VALUES ('lot_view','/catalago/leilao-martendal-weekend-2026/matrizes','matrizes','102',NULL,'https://youtu.be/test','matrizes-contract-test-68','Test','Desktop');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> false THEN RAISE EXCEPTION 'Case 68 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type) VALUES ('catalog_video_click','/catalago/leilao-martendal-weekend-2026/matrizes','matrizes','102','Test animal',NULL,'matrizes-contract-test-69','Test','Desktop');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> false THEN RAISE EXCEPTION 'Case 69 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type) VALUES ('catalog_selected','/catalago/leilao-martendal-weekend-2026','matrizes',NULL,NULL,NULL,'matrizes-contract-test-70','Test','Desktop');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> true THEN RAISE EXCEPTION 'Case 70 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type) VALUES ('lot_view','/catalago/leilao-martendal-weekend-2026/matrizes','machos','102','Test animal',NULL,'matrizes-contract-test-71','Test','Desktop');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> true THEN RAISE EXCEPTION 'Case 71 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type) VALUES ('lot_view','/catalago/leilao-martendal-weekend-2026/machos','matrizes','102','Test animal',NULL,'matrizes-contract-test-72','Test','Desktop');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> true THEN RAISE EXCEPTION 'Case 72 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type) VALUES ('lot_view','/catalago/leilao-martendal-weekend-2026/femeas','matrizes','102','Test animal',NULL,'matrizes-contract-test-73','Test','Desktop');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> true THEN RAISE EXCEPTION 'Case 73 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type) VALUES ('catalog_selected','/catalago/leilao-martendal-weekend-2026','__proto__',NULL,NULL,NULL,'matrizes-contract-test-74','Test','Desktop');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> false THEN RAISE EXCEPTION 'Case 74 failed'; END IF;
  accepted := true;
  BEGIN
    INSERT INTO public.martendal_tracking_events (event_type,landing_path,catalog_key,lot_number,horse_name,video_url,session_id,traffic_source,device_type) VALUES ('catalog_selected','/catalago/leilao-martendal-weekend-2026','constructor',NULL,NULL,NULL,'matrizes-contract-test-75','Test','Desktop');
  EXCEPTION WHEN check_violation THEN accepted := false;
  END;
  IF accepted <> false THEN RAISE EXCEPTION 'Case 75 failed'; END IF;
END;
$test$;
RESET ROLE;
DO $test$
BEGIN
  IF EXISTS (SELECT FROM public.martendal_tracking_events WHERE session_id LIKE 'matrizes-contract-test-%'
    AND landing_path LIKE '/catalago/%/%'
    AND (catalog_key IS DISTINCT FROM split_part(landing_path, '/', 4)
      OR catalog_name IS DISTINCT FROM CASE split_part(landing_path, '/', 4)
      WHEN 'machos' THEN 'Quarto de Milha - Martendal Weekend 2026'
      WHEN 'femeas' THEN 'Fêmeas Elite - Martendal Weekend 2026'
      WHEN 'matrizes' THEN 'Matrizes - Martendal Weekend 2026' END)) THEN
    RAISE EXCEPTION 'Path-derived metadata mismatch';
  END IF;
END;
$test$;
SET LOCAL ROLE anon;
INSERT INTO public.martendal_tracking_events(event_type,landing_path,session_id,lot_number,horse_name,device_type,traffic_source) VALUES ('lot_view','/catalago/leilao-martendal-weekend-2026/machos','matrizes-contract-test-dedup','102','Test animal','Desktop','Test');
INSERT INTO public.martendal_tracking_events(event_type,landing_path,session_id,lot_number,horse_name,device_type,traffic_source) VALUES ('lot_view','/catalago/leilao-martendal-weekend-2026/femeas','matrizes-contract-test-dedup','102','Test animal','Desktop','Test');
INSERT INTO public.martendal_tracking_events(event_type,landing_path,session_id,lot_number,horse_name,device_type,traffic_source) VALUES ('lot_view','/catalago/leilao-martendal-weekend-2026/matrizes','matrizes-contract-test-dedup','102','Test animal','Desktop','Test');
DO $test$
DECLARE blocked boolean;
BEGIN
  blocked := false;
  BEGIN
    INSERT INTO public.martendal_tracking_events(event_type,landing_path,session_id,lot_number,horse_name,device_type,traffic_source)
    VALUES ('lot_view','/catalago/leilao-martendal-weekend-2026/matrizes','matrizes-contract-test-dedup','102','Test animal','Desktop','Test');
  EXCEPTION WHEN unique_violation THEN blocked := true;
  END;
  IF NOT blocked THEN RAISE EXCEPTION 'Duplicate lot view accepted'; END IF;
  blocked := false;
  BEGIN PERFORM id FROM public.martendal_tracking_events LIMIT 1;
  EXCEPTION WHEN insufficient_privilege THEN blocked := true; END;
  IF NOT blocked THEN RAISE EXCEPTION 'anon SELECT allowed'; END IF;
  IF has_table_privilege('anon','public.martendal_tracking_events','UPDATE') OR
     has_any_column_privilege('anon','public.martendal_tracking_events','UPDATE') OR
     has_table_privilege('anon','public.martendal_tracking_events','DELETE') THEN
     RAISE EXCEPTION 'anon mutation privilege widened';
  END IF;
END;
$test$;
RESET ROLE;
SELECT 'PASS: 76 cases, canonical metadata, three catalogs / same session / lot 102, duplicate rejected, anon permissions' AS result;
ROLLBACK;
