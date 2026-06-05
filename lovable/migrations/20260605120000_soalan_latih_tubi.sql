-- Soalan Latih Tubi table
CREATE TABLE IF NOT EXISTS public.soalan_latih_tubi (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  darjah_id TEXT NOT NULL,
  subjek_id TEXT NOT NULL,
  soalan TEXT NOT NULL,
  pilihan JSONB NOT NULL,
  jawapan INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS soalan_latih_tubi_darjah_subjek_idx
  ON public.soalan_latih_tubi (darjah_id, subjek_id);

GRANT SELECT ON public.soalan_latih_tubi TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.soalan_latih_tubi TO authenticated;
GRANT ALL ON public.soalan_latih_tubi TO service_role;

ALTER TABLE public.soalan_latih_tubi ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read soalan latih tubi"
  ON public.soalan_latih_tubi FOR SELECT
  USING (true);

-- Seed soalan Matematik Darjah 1
INSERT INTO public.soalan_latih_tubi (darjah_id, subjek_id, soalan, pilihan, jawapan) VALUES
('1','matematik','1 + 1 = ?','["1","2","3","4"]'::jsonb,1),
('1','matematik','2 + 3 = ?','["4","5","6","7"]'::jsonb,1),
('1','matematik','5 - 2 = ?','["1","2","3","4"]'::jsonb,2),
('1','matematik','4 + 4 = ?','["6","7","8","9"]'::jsonb,2),
('1','matematik','10 - 5 = ?','["3","4","5","6"]'::jsonb,2),
('1','matematik','6 + 2 = ?','["7","8","9","10"]'::jsonb,1),
('1','matematik','9 - 3 = ?','["5","6","7","8"]'::jsonb,1),
('1','matematik','3 + 5 = ?','["6","7","8","9"]'::jsonb,2),
('1','matematik','7 - 4 = ?','["2","3","4","5"]'::jsonb,1),
('1','matematik','2 + 6 = ?','["7","8","9","10"]'::jsonb,1),
('1','matematik','Nombor selepas 9?','["8","10","11","12"]'::jsonb,1),
('1','matematik','Nombor sebelum 5?','["3","4","6","7"]'::jsonb,1),
('1','matematik','5 + 5 = ?','["8","9","10","11"]'::jsonb,2),
('1','matematik','8 - 6 = ?','["1","2","3","4"]'::jsonb,1),
('1','matematik','Berapa sisi segitiga?','["2","3","4","5"]'::jsonb,1),

-- Bahasa Melayu Darjah 1
('1','bahasa-melayu','Huruf vokal pertama?','["a","b","c","d"]'::jsonb,0),
('1','bahasa-melayu','Berapa huruf vokal?','["3","4","5","6"]'::jsonb,2),
('1','bahasa-melayu','''bu'' + ''ku'' = ?','["baku","biku","buku","buke"]'::jsonb,2),
('1','bahasa-melayu','Lawan ''besar''?','["tinggi","kecil","panjang","lebar"]'::jsonb,1),
('1','bahasa-melayu','Ejaan betul?','["kusing","kucing","kocing","kuching"]'::jsonb,1),
('1','bahasa-melayu','''ma'' + ''ta'' = ?','["mati","mata","muta","mota"]'::jsonb,1),
('1','bahasa-melayu','Haiwan 🐶 ialah?','["kucing","arnab","anjing","tikus"]'::jsonb,2),
('1','bahasa-melayu','Suku kata ''bola''?','["1","2","3","4"]'::jsonb,1),
('1','bahasa-melayu','Huruf bukan vokal?','["a","e","i","b"]'::jsonb,3),
('1','bahasa-melayu','Pilih ayat betul:','["Saya makan","Makan saya","Saya nasi","Nasi makan"]'::jsonb,0),

-- Bahasa Inggeris Darjah 1
('1','bahasa-inggeris','Letter after A?','["B","C","D","E"]'::jsonb,0),
('1','bahasa-inggeris','How many letters in alphabet?','["24","25","26","27"]'::jsonb,2),
('1','bahasa-inggeris','Which is a vowel?','["b","c","o","d"]'::jsonb,2),
('1','bahasa-inggeris','What colour is the sky?','["red","green","yellow","blue"]'::jsonb,3),
('1','bahasa-inggeris','Opposite of big?','["tall","long","small","wide"]'::jsonb,2),
('1','bahasa-inggeris','I ___ a student.','["is","are","am","be"]'::jsonb,2),
('1','bahasa-inggeris','Morning greeting?','["Good night","Good evening","Good morning","Hello"]'::jsonb,2),
('1','bahasa-inggeris','What is 🐱?','["dog","cat","rabbit","bird"]'::jsonb,1),
('1','bahasa-inggeris','Days in a week?','["5","6","7","8"]'::jsonb,2),
('1','bahasa-inggeris','Word starts with B?','["apple","cat","ball","dog"]'::jsonb,2),

-- Jawi Darjah 1
('1','jawi','Huruf ا ialah?','["Ba","Ta","Alif","Jim"]'::jsonb,2),
('1','jawi','Huruf ب ialah?','["Alif","Ba","Ta","Tha"]'::jsonb,1),
('1','jawi','Huruf د ialah?','["Ra","Zai","Wau","Dal"]'::jsonb,3),
('1','jawi','Huruf م ialah?','["Nun","Wau","Mim","Lam"]'::jsonb,2),
('1','jawi','Huruf ن ialah?','["Mim","Wau","Nun","Ya"]'::jsonb,2),
('1','jawi','Huruf bunyi R?','["د","ر","ز","و"]'::jsonb,1),
('1','jawi','Huruf bunyi L?','["ن","م","ل","و"]'::jsonb,2),
('1','jawi','Huruf bunyi W?','["ي","ن","م","و"]'::jsonb,3),
('1','jawi','اِبُو bermaksud?','["abang","ibu","adik","ayah"]'::jsonb,1),
('1','jawi','بُکُو bermaksud?','["pen","meja","buku","kerusi"]'::jsonb,2),

-- Pendidikan Islam Darjah 1
('1','pendidikan-islam','Berapa rukun Islam?','["3","4","5","6"]'::jsonb,2),
('1','pendidikan-islam','Berapa kali solat sehari?','["3","4","5","6"]'::jsonb,2),
('1','pendidikan-islam','Solat pagi ialah?','["Zohor","Asar","Subuh","Isyak"]'::jsonb,2),
('1','pendidikan-islam','Ucapan berjumpa?','["Hai","Selamat pagi","Assalamualaikum","Terima kasih"]'::jsonb,2),
('1','pendidikan-islam','Jawapan salam?','["Assalamualaikum","Alhamdulillah","Waalaikumussalam","Bismillah"]'::jsonb,2),
('1','pendidikan-islam','Baca bismillah sebelum?','["tidur","bermain","makan","berlari"]'::jsonb,2),
('1','pendidikan-islam','Rakaat solat Subuh?','["1","2","3","4"]'::jsonb,1),
('1','pendidikan-islam','Adab makan?','["tangan kiri","berdiri","berlari","tangan kanan"]'::jsonb,3),
('1','pendidikan-islam','Kitab suci Islam?','["Injil","Zabur","Taurat","Al-Quran"]'::jsonb,3),
('1','pendidikan-islam','Nabi kita?','["Nabi Isa","Nabi Musa","Nabi Ibrahim","Nabi Muhammad SAW"]'::jsonb,3),

-- Sains Darjah 1
('1','sains','Berapa deria manusia?','["3","4","5","6"]'::jsonb,2),
('1','sains','Deria untuk melihat?','["hidung","telinga","mata","tangan"]'::jsonb,2),
('1','sains','Deria menghidu?','["mata","hidung","telinga","lidah"]'::jsonb,1),
('1','sains','Fungsi telinga?','["melihat","menghidu","merasa","mendengar"]'::jsonb,3),
('1','sains','Haiwan boleh terbang?','["ikan","arnab","burung","kucing"]'::jsonb,2),
('1','sains','Bahagian tumbuhan serap air?','["daun","batang","bunga","akar"]'::jsonb,3),
('1','sains','Sumber cahaya semula jadi?','["lampu","lilin","matahari","suluh"]'::jsonb,2),
('1','sains','Air jadi wap apabila?','["dibekukan","dipanaskan","didinginkan","dicampur gula"]'::jsonb,1),
('1','sains','Ais terdedah haba akan?','["membeku","membesar","cair","mengeras"]'::jsonb,2),
('1','sains','Makanan arnab?','["daging","ikan","sayur dan wortel","buah sahaja"]'::jsonb,2);
