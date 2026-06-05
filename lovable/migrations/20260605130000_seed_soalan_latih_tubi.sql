-- Seed Latih Tubi questions into the existing soalan_latih_tubi table
-- Existing schema: id, darjah (int), subjek (text), soalan (text),
--   pilihan_a, pilihan_b, pilihan_c, pilihan_d (text), jawapan_betul (text 'A'/'B'/'C'/'D')

INSERT INTO public.soalan_latih_tubi (darjah, subjek, soalan, pilihan_a, pilihan_b, pilihan_c, pilihan_d, jawapan_betul) VALUES
-- Matematik Darjah 1
(1,'matematik','1 + 1 = ?','1','2','3','4','B'),
(1,'matematik','2 + 3 = ?','4','5','6','7','B'),
(1,'matematik','5 - 2 = ?','1','2','3','4','C'),
(1,'matematik','4 + 4 = ?','6','7','8','9','C'),
(1,'matematik','10 - 5 = ?','3','4','5','6','C'),
(1,'matematik','6 + 2 = ?','7','8','9','10','B'),
(1,'matematik','9 - 3 = ?','5','6','7','8','B'),
(1,'matematik','3 + 5 = ?','6','7','8','9','C'),
(1,'matematik','7 - 4 = ?','2','3','4','5','B'),
(1,'matematik','2 + 6 = ?','7','8','9','10','B'),
(1,'matematik','Nombor selepas 9?','8','10','11','12','B'),
(1,'matematik','Nombor sebelum 5?','3','4','6','7','B'),
(1,'matematik','5 + 5 = ?','8','9','10','11','C'),
(1,'matematik','8 - 6 = ?','1','2','3','4','B'),
(1,'matematik','Berapa sisi segitiga?','2','3','4','5','B'),

-- Bahasa Melayu Darjah 1
(1,'bahasa-melayu','Huruf vokal pertama?','a','b','c','d','A'),
(1,'bahasa-melayu','Berapa huruf vokal?','3','4','5','6','C'),
(1,'bahasa-melayu','''bu'' + ''ku'' = ?','baku','biku','buku','buke','C'),
(1,'bahasa-melayu','Lawan ''besar''?','tinggi','kecil','panjang','lebar','B'),
(1,'bahasa-melayu','Ejaan betul?','kusing','kucing','kocing','kuching','B'),
(1,'bahasa-melayu','''ma'' + ''ta'' = ?','mati','mata','muta','mota','B'),
(1,'bahasa-melayu','Haiwan menyalak ialah?','kucing','arnab','anjing','tikus','C'),
(1,'bahasa-melayu','Suku kata ''bola''?','1','2','3','4','B'),
(1,'bahasa-melayu','Huruf bukan vokal?','a','e','i','b','D'),
(1,'bahasa-melayu','Pilih ayat betul:','Saya makan','Makan saya','Saya nasi','Nasi makan','A'),

-- Bahasa Inggeris Darjah 1
(1,'bahasa-inggeris','Letter after A?','B','C','D','E','A'),
(1,'bahasa-inggeris','How many letters in alphabet?','24','25','26','27','C'),
(1,'bahasa-inggeris','Which is a vowel?','b','c','o','d','C'),
(1,'bahasa-inggeris','What colour is the sky?','red','green','yellow','blue','D'),
(1,'bahasa-inggeris','Opposite of big?','tall','long','small','wide','C'),
(1,'bahasa-inggeris','I ___ a student.','is','are','am','be','C'),
(1,'bahasa-inggeris','Morning greeting?','Good night','Good evening','Good morning','Hello','C'),
(1,'bahasa-inggeris','Cat in Malay?','dog','cat','rabbit','bird','B'),
(1,'bahasa-inggeris','Days in a week?','5','6','7','8','C'),
(1,'bahasa-inggeris','Word starts with B?','apple','cat','ball','dog','C'),

-- Jawi Darjah 1
(1,'jawi','Huruf ا ialah?','Ba','Ta','Alif','Jim','C'),
(1,'jawi','Huruf ب ialah?','Alif','Ba','Ta','Tha','B'),
(1,'jawi','Huruf د ialah?','Ra','Zai','Wau','Dal','D'),
(1,'jawi','Huruf م ialah?','Nun','Wau','Mim','Lam','C'),
(1,'jawi','Huruf ن ialah?','Mim','Wau','Nun','Ya','C'),
(1,'jawi','Huruf bunyi R?','د','ر','ز','و','B'),
(1,'jawi','Huruf bunyi L?','ن','م','ل','و','C'),
(1,'jawi','Huruf bunyi W?','ي','ن','م','و','D'),
(1,'jawi','اِبُو bermaksud?','abang','ibu','adik','ayah','B'),
(1,'jawi','بُکُو bermaksud?','pen','meja','buku','kerusi','C'),

-- Pendidikan Islam Darjah 1
(1,'pendidikan-islam','Berapa rukun Islam?','3','4','5','6','C'),
(1,'pendidikan-islam','Berapa kali solat sehari?','3','4','5','6','C'),
(1,'pendidikan-islam','Solat pagi ialah?','Zohor','Asar','Subuh','Isyak','C'),
(1,'pendidikan-islam','Ucapan berjumpa?','Hai','Selamat pagi','Assalamualaikum','Terima kasih','C'),
(1,'pendidikan-islam','Jawapan salam?','Assalamualaikum','Alhamdulillah','Waalaikumussalam','Bismillah','C'),
(1,'pendidikan-islam','Baca bismillah sebelum?','tidur','bermain','makan','berlari','C'),
(1,'pendidikan-islam','Rakaat solat Subuh?','1','2','3','4','B'),
(1,'pendidikan-islam','Adab makan?','tangan kiri','berdiri','berlari','tangan kanan','D'),
(1,'pendidikan-islam','Kitab suci Islam?','Injil','Zabur','Taurat','Al-Quran','D'),
(1,'pendidikan-islam','Nabi kita?','Nabi Isa','Nabi Musa','Nabi Ibrahim','Nabi Muhammad SAW','D'),

-- Sains Darjah 1
(1,'sains','Berapa deria manusia?','3','4','5','6','C'),
(1,'sains','Deria untuk melihat?','hidung','telinga','mata','tangan','C'),
(1,'sains','Deria menghidu?','mata','hidung','telinga','lidah','B'),
(1,'sains','Fungsi telinga?','melihat','menghidu','merasa','mendengar','D'),
(1,'sains','Haiwan boleh terbang?','ikan','arnab','burung','kucing','C'),
(1,'sains','Bahagian tumbuhan serap air?','daun','batang','bunga','akar','D'),
(1,'sains','Sumber cahaya semula jadi?','lampu','lilin','matahari','suluh','C'),
(1,'sains','Air jadi wap apabila?','dibekukan','dipanaskan','didinginkan','dicampur gula','B'),
(1,'sains','Ais terdedah haba akan?','membeku','membesar','cair','mengeras','C'),
(1,'sains','Makanan arnab?','daging','ikan','sayur dan wortel','buah sahaja','C');
