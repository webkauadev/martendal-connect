-- Completes only the two administrative read RPCs. No tracking DML/auth changes.
SET LOCAL lock_timeout = '5s';

CREATE OR REPLACE FUNCTION public.panel_v2_get_dashboard(
 p_broker_secret text, p_session_hash text, p_filters jsonb DEFAULT '{}'::jsonb
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE f jsonb:=coalesce(p_filters,'{}'::jsonb); a timestamptz; z timestamptz;
BEGIN
 IF NOT coalesce(private.panel_v2_authorized_session(p_broker_secret,p_session_hash),false) THEN
   RAISE EXCEPTION 'unauthorized' USING ERRCODE='28000';
 END IF;
 IF jsonb_typeof(f)<>'object' OR EXISTS (
   SELECT 1 FROM jsonb_each(f) WHERE key NOT IN
   ('start_at','end_at','experience','catalog_key','source','campaign','term','content','event','device','lot','search','session_id')
   OR jsonb_typeof(value) NOT IN ('string','null') OR length(value #>> '{}')>200
 ) THEN RAISE EXCEPTION 'invalid_filters' USING ERRCODE='22023'; END IF;
 IF nullif(f->>'experience','') IS NOT NULL AND f->>'experience' NOT IN ('squeeze','catalog')
 OR nullif(f->>'catalog_key','') IS NOT NULL AND f->>'catalog_key' NOT IN ('machos','femeas','matrizes')
 OR nullif(f->>'device','') IS NOT NULL AND f->>'device' NOT IN ('Mobile','Tablet','Desktop','Unknown')
 OR nullif(f->>'event','') IS NOT NULL AND f->>'event' NOT IN ('page_view','whatsapp_click','catalog_view','lot_view','lot_whatsapp_click','catalog_whatsapp_click','catalog_video_click','pdf_download','catalog_selector_view','catalog_selected')
 THEN RAISE EXCEPTION 'invalid_filters' USING ERRCODE='22023'; END IF;
 BEGIN
   a:=nullif(f->>'start_at','')::timestamptz; z:=nullif(f->>'end_at','')::timestamptz;
 EXCEPTION WHEN others THEN RAISE EXCEPTION 'invalid_dates' USING ERRCODE='22023'; END;
 IF (a IS NOT NULL AND NOT isfinite(a)) OR (z IS NOT NULL AND NOT isfinite(z)) OR (a IS NOT NULL AND z IS NOT NULL AND z<=a)
 THEN RAISE EXCEPTION 'invalid_dates' USING ERRCODE='22023'; END IF;
 RETURN (
WITH base AS NOT MATERIALIZED (
 SELECT e.*, coalesce(nullif(session_id,''),id::text) sid,
 CASE WHEN experience_type IN ('squeeze','catalog') THEN experience_type
      WHEN landing_path LIKE '/catalago/%' THEN 'catalog' ELSE 'squeeze' END xp,
 CASE
  WHEN catalog_key='machos' OR catalog_name='Quarto de Milha - Martendal Weekend 2026' OR landing_path='/catalago/leilao-martendal-weekend-2026/machos' THEN 'machos'
  WHEN catalog_key='femeas' OR catalog_name='Fêmeas Elite - Martendal Weekend 2026' OR landing_path='/catalago/leilao-martendal-weekend-2026/femeas' THEN 'femeas'
  WHEN catalog_key='matrizes' OR catalog_name='Matrizes - Martendal Weekend 2026' OR landing_path='/catalago/leilao-martendal-weekend-2026/matrizes' THEN 'matrizes'
  WHEN coalesce(lot_number,'')<>'' THEN 'machos' ELSE NULL END ck
 FROM public.martendal_tracking_events e
), normalized AS NOT MATERIALIZED (
 SELECT b.*,
 CASE WHEN btrim(coalesce(traffic_source,''))='' THEN 'Direto / Desconhecido' ELSE traffic_source END source_label,
 CASE WHEN btrim(coalesce(utm_campaign,''))='' THEN 'Sem campanha identificada' ELSE utm_campaign END campaign_label,
 CASE WHEN btrim(coalesce(utm_term,''))='' THEN 'Sem conjunto identificado' ELSE utm_term END term_label,
 CASE WHEN btrim(coalesce(utm_content,''))='' THEN 'Sem criativo identificado' ELSE utm_content END content_label,
 CASE WHEN btrim(coalesce(utm_source,''))='' THEN 'sem utm_source' ELSE utm_source END utm_source_label,
 CASE WHEN btrim(coalesce(device_type,''))='' THEN 'Unknown' ELSE device_type END device_label
 FROM base b
), x AS MATERIALIZED (SELECT * FROM normalized WHERE (a IS NULL OR created_at>=a) AND (z IS NULL OR created_at<z)
 AND (nullif(f->>'experience','') IS NULL OR xp=f->>'experience')
 AND (nullif(f->>'catalog_key','') IS NULL OR (xp='catalog' AND ck=f->>'catalog_key'))
 AND (nullif(f->>'source','') IS NULL OR source_label=f->>'source')
 AND (nullif(f->>'campaign','') IS NULL OR campaign_label=f->>'campaign')
 AND (nullif(f->>'term','') IS NULL OR term_label=f->>'term')
 AND (nullif(f->>'content','') IS NULL OR content_label=f->>'content')
 AND (nullif(f->>'device','') IS NULL OR device_label=f->>'device')
 AND (nullif(f->>'event','') IS NULL OR event_type=f->>'event')
 AND (nullif(f->>'lot','') IS NULL OR coalesce(ck,'selector')||':'||coalesce(lot_number,'')=f->>'lot')
 AND (nullif(f->>'search','') IS NULL OR strpos(lower(coalesce(lot_number,'')||' '||coalesce(horse_name,'')),lower(btrim(f->>'search')))>0)
 AND (nullif(f->>'session_id','') IS NULL OR sid=f->>'session_id')),
sm AS (SELECT count(*) total_events, count(*) filter(where event_type in('page_view','catalog_view')) accesses,count(distinct sid) filter(where event_type in('page_view','catalog_view')) uniques,count(*) filter(where event_type in('whatsapp_click','catalog_whatsapp_click','lot_whatsapp_click')) clicks,count(distinct sid) filter(where event_type in('whatsapp_click','catalog_whatsapp_click','lot_whatsapp_click')) click_sessions,count(*) filter(where xp='squeeze' and event_type='page_view') sq_accesses,count(distinct sid) filter(where xp='squeeze' and event_type='page_view') sq_uniques,count(*) filter(where xp='squeeze' and event_type='whatsapp_click') sq_clicks,count(distinct sid) filter(where xp='squeeze' and event_type='whatsapp_click') sq_click_sessions,count(*) filter(where xp='catalog' and event_type='catalog_view') cat_accesses,count(distinct sid) filter(where xp='catalog' and event_type='catalog_view') cat_uniques,count(*) filter(where xp='catalog' and event_type='lot_view') lot_views,count(distinct sid) filter(where xp='catalog' and event_type='lot_view') lot_sessions,count(distinct (sid,ck,lot_number)) filter(where xp='catalog' and event_type='lot_view' and nullif(lot_number,'') is not null) unique_lot_views,count(*) filter(where xp='catalog' and event_type='catalog_video_click') video_clicks,count(distinct sid) filter(where xp='catalog' and event_type='catalog_video_click') video_sessions,count(*) filter(where xp='catalog' and event_type in('catalog_whatsapp_click','lot_whatsapp_click')) cat_wa_clicks,count(distinct sid) filter(where xp='catalog' and event_type in('catalog_whatsapp_click','lot_whatsapp_click')) cat_wa_sessions,count(*) filter(where xp='catalog' and event_type='lot_whatsapp_click') interest_clicks,count(distinct sid) filter(where xp='catalog' and event_type='lot_whatsapp_click') interested_sessions,count(distinct (sid,ck,lot_number)) filter(where xp='catalog' and event_type='lot_whatsapp_click' and nullif(lot_number,'') is not null) interested_lots,count(*) filter(where xp='catalog' and event_type='pdf_download') pdfs FROM x),
ts AS (
 SELECT (created_at AT TIME ZONE 'America/Porto_Velho')::date bucket,
 count(*) FILTER(WHERE event_type IN ('page_view','catalog_view')) acessos, count(*) FILTER(WHERE event_type IN ('whatsapp_click','catalog_whatsapp_click','lot_whatsapp_click')) cliques
 FROM x GROUP BY 1
), cts AS (
 SELECT (created_at AT TIME ZONE 'America/Porto_Velho')::date bucket,
 count(DISTINCT sid) FILTER(WHERE event_type='catalog_view') visitantes,
 count(DISTINCT (sid,ck,lot_number)) FILTER(WHERE event_type='lot_view' AND nullif(lot_number,'') IS NOT NULL) lotes,
 count(DISTINCT (sid,ck,lot_number)) FILTER(WHERE event_type='lot_whatsapp_click' AND nullif(lot_number,'') IS NOT NULL) interesses,
 count(*) FILTER(WHERE event_type IN ('whatsapp_click','catalog_whatsapp_click','lot_whatsapp_click')) whatsapp
 FROM x WHERE xp='catalog' GROUP BY 1
), groups AS (
 SELECT g.kind,g.key,
 count(*) FILTER(WHERE event_type IN ('page_view','catalog_view')) views,
 count(DISTINCT sid) FILTER(WHERE event_type IN ('page_view','catalog_view')) uniques,
 count(*) FILTER(WHERE event_type IN ('whatsapp_click','catalog_whatsapp_click','lot_whatsapp_click')) clicks,
 count(DISTINCT sid) FILTER(WHERE event_type IN ('whatsapp_click','catalog_whatsapp_click','lot_whatsapp_click')) click_sessions
 FROM x CROSS JOIN LATERAL (VALUES
 ('source',source_label),('campaign',campaign_label),('term',term_label),
 ('content',content_label),('utm_source',utm_source_label),('device',device_label),
 ('catalog',coalesce(ck,'selector')),('event',event_type),
 ('meta',CASE WHEN coalesce(campaign_id,'')<>'' OR coalesce(adset_id,'')<>'' OR coalesce(ad_id,'')<>'' THEN coalesce(campaign_id,'-')||' / '||coalesce(adset_id,'-')||' / '||coalesce(ad_id,'-') END)
 ) g(kind,key) WHERE g.key IS NOT NULL GROUP BY 1,2
), breakdowns AS (
 SELECT kind,jsonb_agg(jsonb_build_object('key',key,'views',views,'uniques',uniques,
 'clicks',clicks,'clickSessions',click_sessions,'rate',coalesce(100.0*click_sessions/nullif(uniques,0),0))
 ORDER BY clicks DESC,views DESC,key) data FROM groups GROUP BY kind
), cg AS (
 SELECT g.kind,g.key,count(DISTINCT sid) sessions,
 count(DISTINCT (sid,ck,lot_number)) FILTER(WHERE event_type='lot_view' AND nullif(lot_number,'') IS NOT NULL) lot_views,
 count(DISTINCT sid) FILTER(WHERE event_type='lot_whatsapp_click') interested,
 count(*) FILTER(WHERE event_type IN ('whatsapp_click','catalog_whatsapp_click','lot_whatsapp_click')) clicks,
 count(DISTINCT sid) FILTER(WHERE event_type IN ('whatsapp_click','catalog_whatsapp_click','lot_whatsapp_click')) click_sessions
 FROM x CROSS JOIN LATERAL (VALUES ('source',source_label),('campaign',campaign_label)) g(kind,key)
 WHERE xp='catalog' GROUP BY 1,2
), cb AS (
 SELECT kind,jsonb_agg(jsonb_build_object('key',key,'sessions',sessions,'lotViews',lot_views,
 'interested',interested,'clicks',clicks,'rate',coalesce(100.0*click_sessions/nullif(sessions,0),0))
 ORDER BY clicks DESC,sessions DESC,key) data FROM cg GROUP BY kind
), lx AS MATERIALIZED (SELECT * FROM x WHERE xp='catalog' AND nullif(lot_number,'') IS NOT NULL),
lg AS (
 SELECT ck,lot_number,
 (array_agg(horse_name ORDER BY created_at,id) FILTER(WHERE nullif(horse_name,'') IS NOT NULL))[1] horse,
 (array_agg(video_url ORDER BY created_at,id) FILTER(WHERE nullif(video_url,'') IS NOT NULL))[1] video_url,
 count(DISTINCT sid) FILTER(WHERE event_type='lot_view') unique_views,
 count(*) FILTER(WHERE event_type='lot_view') total_views,
 count(*) FILTER(WHERE event_type='catalog_video_click') video_clicks,
 count(DISTINCT sid) FILTER(WHERE event_type='catalog_video_click') video_sessions,
 count(*) FILTER(WHERE event_type='lot_whatsapp_click') wa_clicks,
 count(DISTINCT sid) FILTER(WHERE event_type='lot_whatsapp_click') interested
 FROM lx GROUP BY 1,2
), ls AS (
 SELECT ck,lot_number,sid,
 bool_or(event_type='catalog_video_click') video,
 bool_or(event_type='lot_whatsapp_click') wa FROM lx GROUP BY 1,2,3
), lvw AS (
 SELECT ck,lot_number,count(*) FILTER(WHERE video AND wa) video_then_wa FROM ls GROUP BY 1,2
), ld AS (
 SELECT ck,lot_number,g.kind,g.key,
 count(*) FILTER(WHERE event_type='lot_view') views,
 count(*) FILTER(WHERE event_type='lot_whatsapp_click') clicks,
 count(DISTINCT sid) FILTER(WHERE event_type='lot_whatsapp_click') interested
 FROM lx CROSS JOIN LATERAL (VALUES ('sources',source_label),('devices',device_label),
 ('campaigns',campaign_label),('contents',content_label)) g(kind,key)
 WHERE event_type='lot_view' OR (event_type='lot_whatsapp_click' AND g.kind IN ('campaigns','contents'))
 GROUP BY 1,2,3,4
), ldm AS (
 SELECT ck,lot_number,kind,jsonb_object_agg(key,CASE WHEN kind IN ('sources','devices') THEN to_jsonb(views)
 ELSE jsonb_build_object('views',views,'clicks',clicks,'interested',interested) END) data FROM ld GROUP BY 1,2,3
), details AS (
 SELECT ck,lot_number,jsonb_object_agg(kind,data) data FROM ldm GROUP BY 1,2
), lots AS (
 SELECT jsonb_build_object('key',lg.ck||':'||lg.lot_number,'catalogKey',lg.ck,'lot',lg.lot_number,
 'horse',coalesce(lg.horse,'—'),'videoUrl',lg.video_url,
 'uniqueViews',lg.unique_views,'totalViews',lg.total_views,'videoClicks',lg.video_clicks,
 'videoSessions',lg.video_sessions,'waClicks',lg.wa_clicks,'interested',lg.interested,
 'videoThenWa',lvw.video_then_wa,'rate',coalesce(100.0*lg.interested/nullif(lg.unique_views,0),0),
 'topSource',coalesce((SELECT key FROM ld WHERE ld.ck=lg.ck AND ld.lot_number=lg.lot_number AND kind='sources' ORDER BY views DESC,key LIMIT 1),'—'),
 'sources',coalesce(details.data->'sources','{}'::jsonb),
 'devices',coalesce(details.data->'devices','{}'::jsonb),
 'campaigns',coalesce(details.data->'campaigns','{}'::jsonb),
 'contents',coalesce(details.data->'contents','{}'::jsonb)) data,lg.unique_views,lg.ck,lg.lot_number
 FROM lg JOIN lvw USING(ck,lot_number) LEFT JOIN details USING(ck,lot_number)
)
SELECT jsonb_build_object(
 'summary',to_jsonb(sm),
 'timeseries',coalesce((SELECT jsonb_agg(jsonb_build_object('day',to_char(bucket,'DD/MM'),'date',bucket,'acessos',acessos,'cliques',cliques) ORDER BY bucket) FROM ts),'[]'::jsonb),
 'catalog_timeseries',coalesce((SELECT jsonb_agg(jsonb_build_object('day',to_char(bucket,'DD/MM'),'date',bucket,'visitantes',visitantes,'lotes',lotes,'interesses',interesses,'whatsapp',whatsapp) ORDER BY bucket) FROM cts),'[]'::jsonb),
 'breakdowns',coalesce((SELECT jsonb_object_agg(kind,data) FROM breakdowns),'{}'::jsonb),
 'catalog_breakdowns',jsonb_build_object('source',coalesce((SELECT data FROM cb WHERE kind='source'),'[]'::jsonb),'campaign',coalesce((SELECT data FROM cb WHERE kind='campaign'),'[]'::jsonb)),
 'lots',coalesce((SELECT jsonb_agg(data ORDER BY unique_views DESC,ck,lot_number) FROM lots),'[]'::jsonb),
 -- Original dropdowns use the complete history, independently of current filters.
 'filter_options',jsonb_build_object(
 'sources',coalesce((SELECT jsonb_agg(v ORDER BY v) FROM (SELECT DISTINCT source_label v FROM normalized) opts),'[]'::jsonb),
 'campaigns',coalesce((SELECT jsonb_agg(v ORDER BY v) FROM (SELECT DISTINCT campaign_label v FROM normalized) opts),'[]'::jsonb),
 'terms',coalesce((SELECT jsonb_agg(v ORDER BY v) FROM (SELECT DISTINCT term_label v FROM normalized) opts),'[]'::jsonb),
 'contents',coalesce((SELECT jsonb_agg(v ORDER BY v) FROM (SELECT DISTINCT content_label v FROM normalized) opts),'[]'::jsonb),
 'devices',coalesce((SELECT jsonb_agg(v ORDER BY v) FROM (SELECT DISTINCT device_label v FROM normalized) opts),'[]'::jsonb),
 'lots',coalesce((SELECT jsonb_agg(v ORDER BY v) FROM (SELECT DISTINCT coalesce(ck,'selector')||':'||lot_number v FROM normalized WHERE nullif(lot_number,'') IS NOT NULL) opts),'[]'::jsonb)
 )) FROM sm
 );
END $$;

-- Replace the old signature to avoid ambiguous PostgREST overload resolution.
DROP FUNCTION public.panel_v2_get_tracking_events_page(text,text,timestamptz,uuid,integer);
CREATE FUNCTION public.panel_v2_get_tracking_events_page(
 p_broker_secret text, p_session_hash text,
 p_cursor_at timestamptz DEFAULT NULL, p_cursor_id uuid DEFAULT NULL,
 p_page_size integer DEFAULT 100, p_filters jsonb DEFAULT '{}'::jsonb
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE f jsonb:=coalesce(p_filters,'{}'::jsonb); a timestamptz; z timestamptz;
BEGIN
 IF NOT coalesce(private.panel_v2_authorized_session(p_broker_secret,p_session_hash),false) THEN
   RAISE EXCEPTION 'unauthorized' USING ERRCODE='28000';
 END IF;
 IF jsonb_typeof(f)<>'object' OR EXISTS (
   SELECT 1 FROM jsonb_each(f) WHERE key NOT IN
   ('start_at','end_at','experience','catalog_key','source','campaign','term','content','event','device','lot','search','session_id')
   OR jsonb_typeof(value) NOT IN ('string','null') OR length(value #>> '{}')>200
 ) THEN RAISE EXCEPTION 'invalid_filters' USING ERRCODE='22023'; END IF;
 IF nullif(f->>'experience','') IS NOT NULL AND f->>'experience' NOT IN ('squeeze','catalog')
 OR nullif(f->>'catalog_key','') IS NOT NULL AND f->>'catalog_key' NOT IN ('machos','femeas','matrizes')
 OR nullif(f->>'device','') IS NOT NULL AND f->>'device' NOT IN ('Mobile','Tablet','Desktop','Unknown')
 OR nullif(f->>'event','') IS NOT NULL AND f->>'event' NOT IN ('page_view','whatsapp_click','catalog_view','lot_view','lot_whatsapp_click','catalog_whatsapp_click','catalog_video_click','pdf_download','catalog_selector_view','catalog_selected')
 THEN RAISE EXCEPTION 'invalid_filters' USING ERRCODE='22023'; END IF;
 BEGIN
   a:=nullif(f->>'start_at','')::timestamptz; z:=nullif(f->>'end_at','')::timestamptz;
 EXCEPTION WHEN others THEN RAISE EXCEPTION 'invalid_dates' USING ERRCODE='22023'; END;
 IF (a IS NOT NULL AND NOT isfinite(a)) OR (z IS NOT NULL AND NOT isfinite(z)) OR (a IS NOT NULL AND z IS NOT NULL AND z<=a)
 THEN RAISE EXCEPTION 'invalid_dates' USING ERRCODE='22023'; END IF;
 IF p_page_size IS NULL OR p_page_size NOT BETWEEN 1 AND 100
 OR (p_cursor_at IS NULL)<>(p_cursor_id IS NULL)
 OR (p_cursor_at IS NOT NULL AND NOT isfinite(p_cursor_at))
 THEN RAISE EXCEPTION 'invalid_page' USING ERRCODE='22023'; END IF;
 RETURN (
WITH base AS NOT MATERIALIZED (
 SELECT e.*, coalesce(nullif(session_id,''),id::text) sid,
 CASE WHEN experience_type IN ('squeeze','catalog') THEN experience_type
      WHEN landing_path LIKE '/catalago/%' THEN 'catalog' ELSE 'squeeze' END xp,
 CASE
  WHEN catalog_key='machos' OR catalog_name='Quarto de Milha - Martendal Weekend 2026' OR landing_path='/catalago/leilao-martendal-weekend-2026/machos' THEN 'machos'
  WHEN catalog_key='femeas' OR catalog_name='Fêmeas Elite - Martendal Weekend 2026' OR landing_path='/catalago/leilao-martendal-weekend-2026/femeas' THEN 'femeas'
  WHEN catalog_key='matrizes' OR catalog_name='Matrizes - Martendal Weekend 2026' OR landing_path='/catalago/leilao-martendal-weekend-2026/matrizes' THEN 'matrizes'
  WHEN coalesce(lot_number,'')<>'' THEN 'machos' ELSE NULL END ck
 FROM public.martendal_tracking_events e
), normalized AS NOT MATERIALIZED (
 SELECT b.*,
 CASE WHEN btrim(coalesce(traffic_source,''))='' THEN 'Direto / Desconhecido' ELSE traffic_source END source_label,
 CASE WHEN btrim(coalesce(utm_campaign,''))='' THEN 'Sem campanha identificada' ELSE utm_campaign END campaign_label,
 CASE WHEN btrim(coalesce(utm_term,''))='' THEN 'Sem conjunto identificado' ELSE utm_term END term_label,
 CASE WHEN btrim(coalesce(utm_content,''))='' THEN 'Sem criativo identificado' ELSE utm_content END content_label,
 CASE WHEN btrim(coalesce(utm_source,''))='' THEN 'sem utm_source' ELSE utm_source END utm_source_label,
 CASE WHEN btrim(coalesce(device_type,''))='' THEN 'Unknown' ELSE device_type END device_label
 FROM base b
), q AS MATERIALIZED (
 SELECT n.* FROM normalized n WHERE (a IS NULL OR created_at>=a) AND (z IS NULL OR created_at<z)
 AND (nullif(f->>'experience','') IS NULL OR xp=f->>'experience')
 AND (nullif(f->>'catalog_key','') IS NULL OR (xp='catalog' AND ck=f->>'catalog_key'))
 AND (nullif(f->>'source','') IS NULL OR source_label=f->>'source')
 AND (nullif(f->>'campaign','') IS NULL OR campaign_label=f->>'campaign')
 AND (nullif(f->>'term','') IS NULL OR term_label=f->>'term')
 AND (nullif(f->>'content','') IS NULL OR content_label=f->>'content')
 AND (nullif(f->>'device','') IS NULL OR device_label=f->>'device')
 AND (nullif(f->>'event','') IS NULL OR event_type=f->>'event')
 AND (nullif(f->>'lot','') IS NULL OR coalesce(ck,'selector')||':'||coalesce(lot_number,'')=f->>'lot')
 AND (nullif(f->>'search','') IS NULL OR strpos(lower(coalesce(lot_number,'')||' '||coalesce(horse_name,'')),lower(btrim(f->>'search')))>0)
 AND (nullif(f->>'session_id','') IS NULL OR sid=f->>'session_id')
 AND (p_cursor_at IS NULL OR (created_at,id)<(p_cursor_at,p_cursor_id))
 ORDER BY created_at DESC,id DESC LIMIT p_page_size+1
), page AS (SELECT * FROM q ORDER BY created_at DESC,id DESC LIMIT p_page_size)
SELECT jsonb_build_object(
 'events',coalesce((SELECT jsonb_agg(to_jsonb(p) - ARRAY['sid','xp','ck','source_label','campaign_label','term_label','content_label','utm_source_label','device_label'] ORDER BY created_at DESC,id DESC) FROM page p),'[]'::jsonb),
 'hasMore',(SELECT count(*)>p_page_size FROM q),
 'nextCursor',CASE WHEN (SELECT count(*)>p_page_size FROM q) THEN
 (SELECT jsonb_build_object('created_at',created_at,'id',id) FROM page ORDER BY created_at,id LIMIT 1) ELSE NULL END
)
 );
END $$;

REVOKE ALL ON FUNCTION public.panel_v2_get_dashboard(text,text,jsonb) FROM PUBLIC,authenticated;
REVOKE ALL ON FUNCTION public.panel_v2_get_tracking_events_page(text,text,timestamptz,uuid,integer,jsonb) FROM PUBLIC,authenticated;
GRANT EXECUTE ON FUNCTION public.panel_v2_get_dashboard(text,text,jsonb) TO anon,service_role;
GRANT EXECUTE ON FUNCTION public.panel_v2_get_tracking_events_page(text,text,timestamptz,uuid,integer,jsonb) TO anon,service_role;
