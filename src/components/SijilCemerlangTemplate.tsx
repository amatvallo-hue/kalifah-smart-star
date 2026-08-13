import logoUrl from "@/assets/kalifah-logo.png";

// Template visual "Sijil Cemerlang" (v2) — dirender ke DOM tersembunyi lalu
// ditangkap oleh html2canvas untuk dijadikan PDF. Design ini adalah source of
// truth yang telah diluluskan; jangan ubah nilai visual tanpa arahan.

export interface SijilCemerlangTemplateProps {
  namaPelajar: string;
  subjekTitle: string;
  darjahLabel: string;
  skillName: string;
  skillDetail: string | null;
  bintang: number;
  tarikh: string;
  certificateId: string;
  qrDataUrl: string;
}

const CSS = `
.sijil-v2 *{ box-sizing:border-box; margin:0; padding:0; }
.sijil-v2{
  --deep-green:#013E37;
  --deep-green-2:#02534A;
  --deep-green-3:#043126;
  --gold:#C9A24B;
  --gold-deep:#B8862B;
  --gold-light:#E8C77A;
  --butter:#FFEEB3;
  --cream:#FBF3DF;
  --cream-2:#F5E9CC;
  font-family:'Poppins',sans-serif;
}
.sijil-v2 .certificate{
  position:relative;
  width:297mm;
  height:210mm;
  background:#013E37;
  overflow:hidden;
}
.sijil-v2 .outer-frame{
  position:absolute;
  top:5mm; right:5mm; bottom:5mm; left:5mm;
  border:2.4px solid #C9A24B;
  border-radius:5mm;
  background:linear-gradient(180deg,#0a4a41,#013E37 30%,#013E37 70%,#0a4a41);
}
.sijil-v2 .outer-frame-2{
  position:absolute;
  top:6.6mm; right:6.6mm; bottom:6.6mm; left:6.6mm;
  border:1px solid rgba(232,199,122,0.7);
  border-radius:4mm;
}
.sijil-v2 .corner{ position:absolute; width:30mm; height:30mm; z-index:3; }
.sijil-v2 .corner svg{ width:100%; height:100%; display:block; overflow:visible; }
.sijil-v2 .corner.tl{ top:9.5mm; left:9.5mm; }
.sijil-v2 .corner.tr{ top:9.5mm; right:9.5mm; transform:scaleX(-1); }
.sijil-v2 .corner.bl{ bottom:9.5mm; left:9.5mm; transform:scaleY(-1); }
.sijil-v2 .corner.br{ bottom:9.5mm; right:9.5mm; transform:scale(-1,-1); }
.sijil-v2 .panel{
  position:absolute;
  top:11mm; right:11mm; bottom:11mm; left:11mm;
  background:linear-gradient(180deg,#FBF3DF 0%,#F5E9CC 100%);
  border:1.6px solid #C9A24B;
  border-radius:1.5mm;
  box-shadow: inset 0 0 0 4.5px #FBF3DF, inset 0 0 0 6px #C9A24B;
  overflow:hidden;
}
.sijil-v2 .panel .texture{
  position:absolute;
  top:0; right:0; bottom:0; left:0;
  opacity:0.32;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='84' height='84' viewBox='0 0 84 84'%3E%3Cg fill='none' stroke='%23C9A24B' stroke-width='0.6' opacity='0.35'%3E%3Cpath d='M42 0 L84 42 L42 84 L0 42 Z'/%3E%3Cpath d='M42 0 L63 21 L42 42 L21 21 Z'/%3E%3Cpath d='M84 42 L63 63 L42 42 L63 21 Z'/%3E%3Cpath d='M42 84 L21 63 L42 42 L63 63 Z'/%3E%3Cpath d='M0 42 L21 21 L42 42 L21 63 Z'/%3E%3C/g%3E%3C/svg%3E");
  background-size:26mm 26mm;
}
.sijil-v2 .panel .inner-hairline{
  position:absolute;
  top:9px; right:9px; bottom:9px; left:9px;
  border:1px solid rgba(201,162,75,0.55);
  pointer-events:none;
}
.sijil-v2 .fleur{ position:absolute; width:16px; height:16px; z-index:2; }
.sijil-v2 .panel > .fleur.top{ top:-9px; left:50%; margin-left:-8px; }
.sijil-v2 .panel > .fleur.bottom{ bottom:-9px; left:50%; margin-left:-8px; }
.sijil-v2 .content{
  position:absolute;
  top:11mm; right:11mm; bottom:11mm; left:11mm;
  display:flex;
  flex-direction:column;
  align-items:center;
  padding:5mm 22mm 4mm 22mm;
  text-align:center;
  z-index:1;
}
.sijil-v2 .logo-official{ display:block; height:34px; width:191px; }
.sijil-v2 .title{
  margin-top:8px;
  font-family:'Playfair Display',serif;
  font-weight:900;
  font-size:40px;
  color:#013E37;
  letter-spacing:3px;
  text-shadow:0 1px 0 rgba(255,255,255,0.4);
}
.sijil-v2 .rule{ margin-top:6px; display:flex; align-items:center; gap:10px; }
.sijil-v2 .rule .line{ width:130px; height:1px; background:linear-gradient(90deg, transparent, #C9A24B); }
.sijil-v2 .rule .line.right{ background:linear-gradient(90deg, #C9A24B, transparent); }
.sijil-v2 .rule .fleur-mid{ width:13px; height:13px; }
.sijil-v2 .given-to{ margin-top:9px; font-size:12.5px; color:#3E5F56; font-weight:500; letter-spacing:0.2px; }
.sijil-v2 .name-row{ margin-top:4px; display:flex; align-items:center; justify-content:center; gap:14px; }
.sijil-v2 .name-row .star{ color:#C9A24B; font-size:17px; flex-shrink:0; }
.sijil-v2 .name-row .swirl{ width:64px; height:22px; flex-shrink:0; }
.sijil-v2 .student-name{
  font-family:'Playfair Display',serif;
  font-weight:800;
  font-size:48px;
  color:#013E37;
  line-height:1;
  padding:0 4px;
  white-space:nowrap;
}
.sijil-v2 .congrats{ margin-top:7px; font-size:12.5px; color:#3E5F56; font-weight:500; }
.sijil-v2 .medal-wrap{
  position:relative; margin-top:10px; width:152px; height:152px;
  display:flex; align-items:center; justify-content:center;
}
.sijil-v2 .medal-wrap .sunburst{
  position:absolute; top:-54px; right:-54px; bottom:-54px; left:-54px;
  background:radial-gradient(circle, rgba(255,238,179,0.85) 0%, rgba(255,238,179,0.4) 26%, rgba(255,238,179,0) 60%);
  z-index:0;
}
.sijil-v2 .medal-svg{ position:relative; z-index:1; width:152px; height:152px; overflow:visible; }
.sijil-v2 .medal-sparkle{ position:absolute; color:#C9A24B; z-index:0; }
.sijil-v2 .ribbon-wrap{ position:relative; margin-top:4px; z-index:2; display:flex; align-items:center; }
.sijil-v2 .ribbon-svg{ width:238px; height:40px; display:block; }
.sijil-v2 .skill-box{
  position:relative; margin-top:14px; width:90%; max-width:610px;
  border:1.4px solid #C9A24B; border-radius:12px; padding:8px 44px;
}
.sijil-v2 .skill-box .bracket{
  position:absolute; top:5px; bottom:5px; width:16px;
  border:1px solid #C9A24B; opacity:0.8;
}
.sijil-v2 .skill-box .bracket.l{ left:5px; border-right:none; border-radius:8px 0 0 8px; }
.sijil-v2 .skill-box .bracket.r{ right:5px; border-left:none; border-radius:0 8px 8px 0; }
.sijil-v2 .laurel{ position:absolute; top:8px; bottom:8px; width:26px; }
.sijil-v2 .laurel.left{ left:22px; }
.sijil-v2 .laurel.right{ right:22px; transform:scaleX(-1); }
.sijil-v2 .skill-meta{ font-size:12px; font-weight:700; letter-spacing:1.5px; color:#013E37; }
.sijil-v2 .skill-meta .dot{ color:#B8862B; margin:0 8px; }
.sijil-v2 .skill-name{
  margin-top:2px; font-family:'Poppins',sans-serif; font-weight:800;
  font-size:25px; color:#013E37; letter-spacing:-0.2px;
}
.sijil-v2 .skill-detail{ margin-top:1px; font-size:12px; letter-spacing:1.5px; font-weight:700; color:#B8862B; }
.sijil-v2 .achieve-row{ margin-top:7px; display:flex; align-items:center; justify-content:center; gap:0; }
.sijil-v2 .achieve-item{ display:flex; align-items:center; gap:10px; padding:0 28px; text-align:left; }
.sijil-v2 .achieve-divider{ width:1px; height:32px; background:#C9A24B; opacity:0.4; }
.sijil-v2 .achieve-icon{ position:relative; width:34px; height:34px; flex-shrink:0; }
.sijil-v2 .achieve-icon .disc{
  position:absolute; top:0; right:0; bottom:0; left:0;
  border-radius:50%; background:#043126; border:2px solid #C9A24B;
  display:flex; align-items:center; justify-content:center;
}
.sijil-v2 .achieve-icon .disc svg{ width:17px; height:17px; }
.sijil-v2 .achieve-icon .tail{ position:absolute; top:24px; left:6px; width:22px; height:16px; }
.sijil-v2 .achieve-title{ font-size:12px; font-weight:700; color:#013E37; letter-spacing:0.2px; }
.sijil-v2 .achieve-sub{ margin-top:1px; font-size:10px; color:#5C7A72; font-weight:500; white-space:nowrap; }
.sijil-v2 .footer{
  margin-top:auto; padding-top:8px; width:100%;
  display:flex; align-items:flex-end; justify-content:space-between;
}
.sijil-v2 .footer-col{ flex:1; display:flex; flex-direction:column; }
.sijil-v2 .footer-col.left{ align-items:flex-start; }
.sijil-v2 .footer-col.center{ align-items:center; }
.sijil-v2 .footer-col.right{ align-items:flex-end; }
.sijil-v2 .signature-mark{ display:block; width:150px; height:auto; margin-left:-6px; margin-bottom:-4px; }
.sijil-v2 .signature-label{ margin-top:0px; font-size:11px; font-weight:700; color:#013E37; }
.sijil-v2 .signature-sub{ font-size:9.5px; color:#5C7A72; }
.sijil-v2 .cert-id-label{ font-size:10px; font-weight:700; letter-spacing:1.6px; color:#3E5F56; }
.sijil-v2 .cert-id-pill{
  margin-top:6px; background:#043126; color:#E8C77A; font-weight:700;
  font-size:13px; letter-spacing:1.8px; padding:7px 22px; border-radius:20px;
  border:1px solid rgba(232,199,122,0.5);
}
.sijil-v2 .verify-label{ font-size:10px; font-weight:700; letter-spacing:1px; color:#013E37; text-align:left; }
.sijil-v2 .verify-sub{ font-size:9px; color:#5C7A72; text-align:left; margin-top:2px; max-width:150px; line-height:1.35; }
.sijil-v2 .verify-row{ display:flex; align-items:flex-end; gap:18px; margin-top:5px; }
.sijil-v2 .qr-wrap{
  width:56px; height:56px; background:#fff; border:1px solid rgba(1,62,55,0.15);
  padding:7px; display:flex; align-items:center; justify-content:center; flex-shrink:0;
}
.sijil-v2 .qr-wrap img{ width:100%; height:100%; display:block; }
`;

const FLEUR_PATH =
  "M8 0 C10 3 10 6 8 9 C6 6 6 3 8 0 Z M0 8 C3 6 6 6 9 8 C6 10 3 10 0 8 Z M16 8 C13 6 10 6 7 8 C10 10 13 10 16 8 Z M8 16 C6 13 6 10 8 7 C10 10 10 13 8 16 Z";

function Fleur({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16">
      <path d={FLEUR_PATH} fill="#C9A24B" />
    </svg>
  );
}

function CornerOrnament({ id }: { id: string }) {
  return (
    <svg viewBox="0 0 130 130" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F3D889" />
          <stop offset="0.5" stopColor="#C9A24B" />
          <stop offset="1" stopColor="#9C7325" />
        </linearGradient>
      </defs>
      <path d="M0 0 H14 V4 H4 V14 H0 Z" fill={`url(#${id})`} />
      <path d="M22 0 H30 V4 H22 Z M0 22 H4 V30 H0 Z" fill={`url(#${id})`} />
      <g transform="translate(14,14)" fill={`url(#${id})`} stroke="#9C7325" strokeWidth="0.6">
        <path d="M0,-32 C7,-24 7,-14 0,-8 C-7,-14 -7,-24 0,-32 Z" />
        <path d="M-32,0 C-24,-7 -14,-7 -8,0 C-14,7 -24,7 -32,0 Z" />
        <path d="M-22.6,-22.6 C-15,-19 -9,-13 -12,-6 C-19,-9 -25,-15 -22.6,-22.6 Z" />
        <circle r="15" fill="none" stroke="#9C7325" strokeWidth="0.7" />
        <circle r="9" fill="#0B3F35" stroke="#E8C77A" strokeWidth="1" />
        <path d="M0,-6 C3,-3 3,3 0,6 C-3,3 -3,-3 0,-6 Z" fill="#E8C77A" stroke="none" />
        <path d="M-6,0 C-3,-3 3,-3 6,0 C3,3 -3,3 -6,0 Z" fill="#E8C77A" stroke="none" />
      </g>
      <path d="M14 0 H60 M0 14 V60" stroke={`url(#${id})`} strokeWidth="2.2" />
      <path d="M14 8 H50 M8 14 V50" stroke={`url(#${id})`} strokeWidth="1" />
      <path d="M45 45 C34 40 30 30 34 20" fill="none" stroke="#C9A24B" strokeWidth="1.1" opacity="0.85" />
      <circle cx="34" cy="20" r="1.6" fill="#C9A24B" />
      <path d="M32 34 c10 8 22 5 28 -4" fill="none" stroke="#C9A24B" strokeWidth="1" opacity="0.7" />
      <path d="M92 22 l3 7 l7 3 l-7 3 l-3 7 l-3 -7 l-7 -3 l7 -3 Z" fill="#C9A24B" />
      <path
        d="M22 92 l2.4 5.6 l5.6 2.4 l-5.6 2.4 l-2.4 5.6 l-2.4 -5.6 l-5.6 -2.4 l5.6 -2.4 Z"
        fill="#C9A24B"
        opacity="0.9"
      />
    </svg>
  );
}

function Swirl({ flip }: { flip?: boolean }) {
  return (
    <svg
      className="swirl"
      viewBox="0 0 64 22"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={flip ? { transform: "scaleX(-1)" } : undefined}
    >
      <path
        d="M2 11 C10 11 10 3 18 3 C24 3 24 9 20 10 C17 11 16 7 19 6.5"
        stroke="#C9A24B"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <path d="M20 10 L26 10.5" stroke="#C9A24B" strokeWidth="1.3" strokeLinecap="round" />
      <path
        d="M60 10.5 l4 0.5 l-2.6 -2.6 M64 11 l-2.6 2.6"
        stroke="#C9A24B"
        strokeWidth="1.3"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

const SCALLOP: [number, number][] = [
  [100.0, 11.0], [123.7, 14.4], [145.4, 24.3], [163.5, 40.0], [176.4, 60.1], [183.1, 83.0],
  [183.1, 107.0], [176.4, 129.9], [163.5, 150.0], [145.4, 165.7], [123.7, 175.6], [100.0, 179.0],
  [76.3, 175.6], [54.6, 165.7], [36.5, 150.0], [23.6, 129.9], [16.9, 107.0], [16.9, 83.0],
  [23.6, 60.1], [36.5, 40.0], [54.6, 24.3], [76.3, 14.4],
];

function Laurel({ className }: { className: string }) {
  const leaves: [number, number, number, number, number][] = [
    [6, 14, 8.5, 4, -24], [20, 14, 8.5, 4, 24],
    [6, 28, 8.5, 4, -24], [20, 28, 8.5, 4, 24],
    [6, 42, 8.5, 4, -24], [20, 42, 8.5, 4, 24],
    [6, 56, 8.5, 4, -24], [20, 56, 8.5, 4, 24],
    [7, 70, 7, 3.4, -24], [19, 70, 7, 3.4, 24],
  ];
  return (
    <svg className={className} viewBox="0 0 26 90" xmlns="http://www.w3.org/2000/svg">
      <path d="M13 88 C13 60 13 30 13 2" fill="none" stroke="#C9A24B" strokeWidth="1.6" />
      <g fill="#C9A24B">
        {leaves.map(([cx, cy, rx, ry, rot], i) => (
          <ellipse key={i} cx={cx} cy={cy} rx={rx} ry={ry} transform={`rotate(${rot} ${cx} ${cy})`} />
        ))}
      </g>
    </svg>
  );
}

function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2.5l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.3l-5.8 3.1 1.1-6.5-4.7-4.6 6.5-.9L12 2.5z"
        fill="#E8C77A"
      />
    </svg>
  );
}

export function SijilCemerlangTemplate({
  namaPelajar,
  subjekTitle,
  darjahLabel,
  skillName,
  skillDetail,
  bintang,
  tarikh,
  certificateId,
  qrDataUrl,
}: SijilCemerlangTemplateProps) {
  return (
    <div className="sijil-v2">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="certificate">
        <div className="outer-frame" />
        <div className="outer-frame-2" />

        <div className="corner tl">
          <CornerOrnament id="cg1" />
        </div>
        <div className="corner tr">
          <CornerOrnament id="cg2" />
        </div>
        <div className="corner bl">
          <CornerOrnament id="cg3" />
        </div>
        <div className="corner br">
          <CornerOrnament id="cg4" />
        </div>

        <div className="panel">
          <div className="texture" />
          <div className="inner-hairline" />
          <Fleur className="fleur top" />
          <Fleur className="fleur bottom" />
        </div>

        <div className="content">
          <img className="logo-official" src={logoUrl} alt="Kalifah.my" />

          <div className="title">SIJIL CEMERLANG</div>

          <div className="rule">
            <div className="line" />
            <Fleur className="fleur-mid" />
            <div className="line right" />
          </div>

          <div className="given-to">Diberikan dengan penuh penghargaan kepada</div>

          <div className="name-row">
            <span className="star">★</span>
            <Swirl />
            <div className="student-name">{namaPelajar}</div>
            <Swirl flip />
            <span className="star">★</span>
          </div>

          <div className="congrats">Tahniah! Anda berjaya menjawab semua soalan dengan betul.</div>

          <div className="medal-wrap">
            <div className="sunburst" />
            <svg
              className="medal-sparkle"
              style={{ top: "-7px", left: "9px", width: "17px", height: "17px" }}
              viewBox="0 0 16 16"
            >
              <path d="M8 0 l1.6 6.4 L16 8 l-6.4 1.6 L8 16 l-1.6 -6.4 L0 8 l6.4 -1.6 Z" fill="#C9A24B" />
            </svg>
            <svg
              className="medal-sparkle"
              style={{ bottom: "12px", right: "0px", width: "12px", height: "12px" }}
              viewBox="0 0 16 16"
            >
              <path d="M8 0 l1.6 6.4 L16 8 l-6.4 1.6 L8 16 l-1.6 -6.4 L0 8 l6.4 -1.6 Z" fill="#C9A24B" />
            </svg>
            <svg className="medal-svg" viewBox="-4 -4 208 208" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="medalGold" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#F6E2A0" />
                  <stop offset="0.45" stopColor="#D9A327" />
                  <stop offset="1" stopColor="#9C7325" />
                </linearGradient>
                <linearGradient id="medalGold2" x1="0" y1="1" x2="1" y2="0">
                  <stop offset="0" stopColor="#9C7325" />
                  <stop offset="0.5" stopColor="#F6E2A0" />
                  <stop offset="1" stopColor="#D9A327" />
                </linearGradient>
              </defs>
              <g stroke="#8a651e" strokeWidth="0.6">
                {SCALLOP.map(([cx, cy], i) => (
                  <circle key={i} cx={cx} cy={cy} r="11.5" fill="url(#medalGold)" />
                ))}
              </g>
              <circle cx="100" cy="95" r="80" fill="url(#medalGold)" stroke="#8a651e" strokeWidth="1" />
              <circle cx="100" cy="95" r="72" fill="url(#medalGold2)" />
              <circle cx="100" cy="95" r="66" fill="#0B3F35" stroke="#F0D896" strokeWidth="2" />
              <circle cx="100" cy="95" r="60" fill="none" stroke="#E8C77A" strokeWidth="1" opacity="0.8" />

              <g fill="#E8C77A" stroke="none">
                <path d="M50 112 C41 106 37 96 41 85" fill="none" stroke="#E8C77A" strokeWidth="2.4" strokeLinecap="round" />
                <ellipse cx="45" cy="106" rx="6.4" ry="3.1" transform="rotate(-35 45 106)" />
                <ellipse cx="40" cy="98" rx="6.4" ry="3.1" transform="rotate(-15 40 98)" />
                <ellipse cx="39" cy="90" rx="6.4" ry="3.1" transform="rotate(5 39 90)" />
                <ellipse cx="42" cy="82" rx="6.4" ry="3.1" transform="rotate(25 42 82)" />
              </g>
              <g fill="#E8C77A" stroke="none">
                <path d="M150 112 C159 106 163 96 159 85" fill="none" stroke="#E8C77A" strokeWidth="2.4" strokeLinecap="round" />
                <ellipse cx="155" cy="106" rx="6.4" ry="3.1" transform="rotate(35 155 106)" />
                <ellipse cx="160" cy="98" rx="6.4" ry="3.1" transform="rotate(15 160 98)" />
                <ellipse cx="161" cy="90" rx="6.4" ry="3.1" transform="rotate(-5 161 90)" />
                <ellipse cx="158" cy="82" rx="6.4" ry="3.1" transform="rotate(-25 158 82)" />
              </g>

              <g transform="translate(100,64)" fill="#E8C77A" stroke="#E8C77A" strokeWidth="1">
                <path d="M-11,-13 h22 v9 c0,7.5 -5,12 -11,12 s-11,-4.5 -11,-12 z" />
                <path d="M-11,-9 c-6,0 -9,2 -9,6 c0,5 4,7.5 8,8" fill="none" stroke="#E8C77A" strokeWidth="2" strokeLinecap="round" />
                <path d="M11,-9 c6,0 9,2 9,6 c0,5 -4,7.5 -8,8" fill="none" stroke="#E8C77A" strokeWidth="2" strokeLinecap="round" />
                <rect x="-2.4" y="8" width="4.8" height="7" />
                <path d="M-8,19 h16 c0,-4 -2,-5.5 -8,-5.5 s-8,1.5 -8,5.5 Z" />
                <path d="M0,-9 l2.1,4.3 4.7,0.7 -3.4,3.3 0.8,4.7 -4.2,-2.2 -4.2,2.2 0.8,-4.7 -3.4,-3.3 4.7,-0.7 Z" fill="#0B3F35" />
              </g>

              <text
                x="100"
                y="122"
                textAnchor="middle"
                fontFamily="Playfair Display, serif"
                fontWeight="900"
                fontSize="32"
                fill="#F0D896"
              >
                100%
              </text>
              <text
                x="100"
                y="141"
                textAnchor="middle"
                fontFamily="Poppins, sans-serif"
                fontWeight="800"
                fontSize="11.5"
                letterSpacing="1.3"
                fill="#F0D896"
              >
                SEMPURNA
              </text>
            </svg>
          </div>

          <div className="ribbon-wrap">
            <svg className="ribbon-svg" viewBox="0 0 238 40" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="ribGold" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#F6E2A0" />
                  <stop offset="0.5" stopColor="#D9A327" />
                  <stop offset="1" stopColor="#B8862B" />
                </linearGradient>
              </defs>
              <polygon points="0,4 20,14 0,24" fill="#9C7325" />
              <polygon points="238,4 218,14 238,24" fill="#9C7325" />
              <polygon points="10,2 228,2 228,30 10,30" fill="url(#ribGold)" stroke="#9C7325" strokeWidth="0.6" />
              <text
                x="119"
                y="21"
                textAnchor="middle"
                fontFamily="Poppins, sans-serif"
                fontWeight="800"
                fontSize="12.5"
                letterSpacing="1"
                fill="#0B3F35"
              >
                SEMUA JAWAPAN BETUL
              </text>
            </svg>
          </div>

          <div className="skill-box">
            <div className="bracket l" />
            <div className="bracket r" />
            <Laurel className="laurel left" />
            <Laurel className="laurel right" />
            <div className="skill-meta">
              <span>{subjekTitle.toUpperCase()}</span>
              <span className="dot">•</span>
              <span>{darjahLabel.toUpperCase()}</span>
            </div>
            <div className="skill-name">{skillName}</div>
            {skillDetail ? <div className="skill-detail">{skillDetail}</div> : null}
          </div>

          <div className="achieve-row">
            <div className="achieve-item">
              <div className="achieve-icon">
                <svg className="tail" viewBox="0 0 22 16" xmlns="http://www.w3.org/2000/svg">
                  <polygon points="4,0 10,0 12,16 7,11 2,16" fill="#0B3F35" />
                  <polygon points="12,0 18,0 20,16 15,11 10,16" fill="#04463A" />
                </svg>
                <div className="disc">
                  <StarIcon />
                </div>
              </div>
              <div>
                <div className="achieve-title">PERFECT SCORE</div>
                <div className="achieve-sub">Tahniah! Pencapaian Hebat!</div>
              </div>
            </div>
            <div className="achieve-divider" />
            <div className="achieve-item">
              <div className="achieve-icon">
                <div className="disc">
                  <StarIcon />
                </div>
              </div>
              <div>
                <div className="achieve-title">
                  <span>+{bintang}</span> BINTANG
                </div>
                <div className="achieve-sub">Ganjaran Diperoleh</div>
              </div>
            </div>
            <div className="achieve-divider" />
            <div className="achieve-item">
              <div className="achieve-icon">
                <div className="disc">
                  <svg viewBox="0 0 24 24" fill="none">
                    <rect x="4" y="5" width="16" height="15" rx="2" stroke="#E8C77A" strokeWidth="1.7" />
                    <path d="M4 10h16M8 3v4M16 3v4" stroke="#E8C77A" strokeWidth="1.7" strokeLinecap="round" />
                  </svg>
                </div>
              </div>
              <div>
                <div className="achieve-title">{tarikh}</div>
                <div className="achieve-sub">Tarikh Dikeluarkan</div>
              </div>
            </div>
          </div>

          <div className="footer">
            <div className="footer-col left">
              <svg
                className="signature-mark"
                viewBox="40 20 300 140"
                width="300"
                height="140"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M 113.50,116.40 L 111.60,115.65 L 109.77,114.85 L 108.03,114.01 L 106.36,113.12 L 104.78,112.20 L 103.27,111.24 L 101.84,110.25 L 100.49,109.23 L 99.21,108.18 L 98.00,107.11 L 96.87,106.02 L 95.80,104.92 L 94.81,103.80 L 93.89,102.66 L 93.03,101.52 L 92.24,100.37 L 91.52,99.21 L 90.85,98.06 L 90.25,96.90 L 89.71,95.74 L 89.20,94.60 L 88.63,93.53 L 88.11,92.45 L 87.63,91.37 L 87.20,90.30 L 86.82,89.22 L 86.48,88.14 L 86.19,87.07 L 85.94,86.00 L 85.73,84.94 L 85.56,83.89 L 85.43,82.84 L 85.33,81.80 L 85.28,80.78 L 85.26,79.76 L 85.28,78.76 L 85.33,77.77 L 85.41,76.80 L 85.53,75.84 L 85.68,74.90 L 85.85,73.97 L 86.06,73.06 L 86.29,72.17 L 86.55,71.31 L 86.84,70.46 L 87.15,69.63 L 87.48,68.82 L 87.84,68.04 L 88.22,67.27 L 88.62,66.53 L 89.04,65.82 L 89.47,65.12 L 89.93,64.45 L 90.40,63.81 L 90.88,63.19 L 91.38,62.59 L 91.89,62.02 L 92.41,61.47 L 92.95,60.95 L 93.49,60.45 L 94.05,59.98 L 94.61,59.53 L 95.18,59.11 L 95.75,58.71 L 96.33,58.34 L 96.92,57.99 L 97.51,57.67 L 98.10,57.37 L 98.69,57.09 L 99.29,56.84 L 99.89,56.61 L 100.48,56.40 L 101.08,56.21 L 101.67,56.05 L 102.26,55.91 L 102.85,55.79 L 103.42,55.64 L 103.98,55.46 L 104.54,55.30 L 105.11,55.15 L 105.67,55.03 L 106.24,54.93 L 106.80,54.84 L 107.36,54.77 L 107.92,54.72 L 108.47,54.69 L 109.02,54.67 L 109.57,54.68 L 110.10,54.69 L 110.64,54.73 L 111.16,54.78 L 111.68,54.84 L 112.19,54.93 L 112.68,55.02 L 113.17,55.13 L 113.65,55.25 L 114.12,55.39 L 114.57,55.53 L 115.01,55.69 L 115.44,55.86 L 115.85,56.04 L 116.25,56.23 L 116.63,56.42 L 117.00,56.63 L 117.35,56.84 L 117.69,57.06 L 118.00,57.28 L 118.30,57.50 L 118.58,57.73 L 118.85,57.96 L 119.09,58.20 L 119.32,58.43 L 119.53,58.66 L 119.72,58.90 L 119.89,59.13 L 120.05,59.36 L 120.19,59.59 L 120.31,59.82 L 120.45,60.04 L 120.58,60.27 L 120.69,60.51 L 120.78,60.75 L 120.85,61.01 L 120.91,61.27 L 120.94,61.54 L 120.94,61.83 L 120.92,62.13 L 120.86,62.44 L 120.77,62.75 L 120.64,63.08 L 120.48,63.41 L 120.27,63.75 L 120.03,64.09 L 119.74,64.42 L 119.42,64.76 L 119.05,65.08 L 118.64,65.40 L 118.19,65.70 L 117.70,66.00 L 117.70,66.00 L 118.27,65.92 L 118.82,65.81 L 119.35,65.69 L 119.86,65.54 L 120.36,65.37 L 120.84,65.18 L 121.30,64.96 L 121.74,64.72 L 122.16,64.45 L 122.56,64.15 L 122.94,63.82 L 123.29,63.46 L 123.62,63.06 L 123.91,62.64 L 124.18,62.19 L 124.41,61.72 L 124.60,61.22 L 124.76,60.70 L 124.88,60.17 L 124.96,59.61 L 125.00,59.05 L 124.96,58.49 L 124.89,57.92 L 124.78,57.35 L 124.64,56.78 L 124.46,56.22 L 124.25,55.66 L 124.01,55.10 L 123.73,54.55 L 123.42,54.01 L 123.09,53.47 L 122.72,52.94 L 122.33,52.42 L 121.91,51.91 L 121.46,51.41 L 120.98,50.92 L 120.48,50.44 L 119.95,49.98 L 119.40,49.53 L 118.82,49.10 L 118.22,48.68 L 117.60,48.27 L 116.95,47.89 L 116.28,47.52 L 115.59,47.17 L 114.88,46.84 L 114.15,46.53 L 113.39,46.24 L 112.62,45.97 L 111.84,45.73 L 111.03,45.51 L 110.21,45.32 L 109.37,45.15 L 108.52,45.01 L 107.65,44.89 L 106.77,44.80 L 105.87,44.75 L 104.97,44.72 L 104.05,44.72 L 103.13,44.75 L 102.20,44.82 L 101.26,44.91 L 100.32,45.09 L 99.40,45.35 L 98.48,45.64 L 97.57,45.97 L 96.66,46.33 L 95.75,46.72 L 94.85,47.14 L 93.96,47.60 L 93.09,48.09 L 92.22,48.61 L 91.36,49.16 L 90.52,49.75 L 89.69,50.37 L 88.87,51.01 L 88.07,51.69 L 87.29,52.41 L 86.53,53.15 L 85.78,53.92 L 85.06,54.72 L 84.36,55.55 L 83.68,56.41 L 83.03,57.30 L 82.40,58.22 L 81.80,59.17 L 81.22,60.14 L 80.67,61.14 L 80.16,62.16 L 79.67,63.21 L 79.21,64.28 L 78.79,65.38 L 78.39,66.49 L 78.04,67.63 L 77.72,68.79 L 77.43,69.98 L 77.18,71.18 L 76.98,72.39 L 76.81,73.63 L 76.68,74.88 L 76.59,76.14 L 76.55,77.42 L 76.54,78.71 L 76.59,80.01 L 76.68,81.32 L 76.81,82.64 L 77.00,83.97 L 77.23,85.31 L 77.51,86.64 L 77.84,87.98 L 78.22,89.32 L 78.66,90.66 L 79.14,92.00 L 79.69,93.34 L 80.28,94.66 L 80.93,95.99 L 81.64,97.30 L 82.41,98.60 L 83.34,99.81 L 84.35,100.99 L 85.42,102.14 L 86.53,103.26 L 87.70,104.35 L 88.91,105.41 L 90.18,106.44 L 91.51,107.43 L 92.88,108.38 L 94.31,109.30 L 95.79,110.17 L 97.32,111.01 L 98.90,111.80 L 100.54,112.55 L 102.23,113.25 L 103.97,113.90 L 105.77,114.51 L 107.62,115.06 L 109.52,115.56 L 111.48,116.01 L 113.50,116.40 Z" fill="#013E37" />
                <text x="82" y="108" fontFamily="Pinyon Script, cursive" fontSize="76" fill="#013E37">
                  Kalifah
                </text>
                <path d="M 60.00,134.00 L 61.30,134.20 L 62.62,134.39 L 63.96,134.58 L 65.31,134.76 L 66.69,134.94 L 68.08,135.12 L 69.49,135.29 L 70.91,135.45 L 72.35,135.61 L 73.81,135.77 L 75.29,135.92 L 76.78,136.06 L 78.28,136.20 L 79.81,136.34 L 81.34,136.47 L 82.89,136.60 L 84.46,136.72 L 86.04,136.84 L 87.63,136.96 L 89.24,137.07 L 90.86,137.17 L 92.50,137.27 L 94.14,137.37 L 95.80,137.47 L 97.47,137.56 L 99.16,137.64 L 100.85,137.72 L 102.56,137.80 L 104.28,137.87 L 106.01,137.94 L 107.75,138.01 L 109.50,138.07 L 111.26,138.13 L 113.03,138.19 L 114.81,138.24 L 116.60,138.29 L 118.40,138.33 L 120.20,138.37 L 122.02,138.41 L 123.84,138.44 L 125.67,138.47 L 127.51,138.50 L 129.36,138.52 L 131.22,138.54 L 133.08,138.56 L 134.94,138.57 L 136.82,138.58 L 138.70,138.59 L 140.58,138.60 L 142.48,138.60 L 144.37,138.60 L 146.27,138.59 L 148.18,138.59 L 150.09,138.58 L 152.01,138.57 L 153.92,138.55 L 155.85,138.53 L 157.77,138.51 L 159.70,138.49 L 161.63,138.46 L 163.57,138.43 L 165.51,138.40 L 167.45,138.37 L 169.39,138.33 L 171.33,138.30 L 173.27,138.26 L 175.22,138.21 L 177.16,138.17 L 179.11,138.12 L 181.05,138.04 L 182.99,137.94 L 184.94,137.83 L 186.88,137.71 L 188.82,137.60 L 190.76,137.48 L 192.70,137.36 L 194.63,137.24 L 196.57,137.12 L 198.50,137.00 L 200.43,136.87 L 202.36,136.74 L 204.28,136.62 L 206.20,136.49 L 208.11,136.35 L 210.03,136.22 L 211.93,136.09 L 213.84,135.95 L 215.74,135.81 L 217.63,135.67 L 219.52,135.53 L 221.40,135.39 L 223.28,135.25 L 225.15,135.11 L 227.01,134.96 L 228.87,134.81 L 230.72,134.67 L 232.57,134.52 L 234.40,134.37 L 236.23,134.22 L 238.05,134.07 L 239.86,133.92 L 241.67,133.77 L 243.46,133.61 L 245.25,133.46 L 247.03,133.31 L 248.79,133.15 L 250.55,133.00 L 252.30,132.84 L 254.04,132.69 L 255.76,132.53 L 257.48,132.37 L 259.18,132.21 L 260.88,132.06 L 262.56,131.90 L 264.23,131.74 L 265.88,131.58 L 267.53,131.42 L 269.16,131.27 L 270.78,131.11 L 272.38,130.95 L 273.97,130.79 L 275.55,130.63 L 277.12,130.47 L 278.67,130.32 L 280.20,130.16 L 281.72,130.00 L 283.23,129.84 L 284.71,129.69 L 286.19,129.53 L 287.65,129.38 L 289.09,129.22 L 290.51,129.07 L 291.92,128.91 L 293.31,128.76 L 294.68,128.60 L 296.04,128.45 L 297.38,128.30 L 298.70,128.15 L 300.00,128.00 L 300.00,128.00 L 298.69,128.09 L 297.37,128.19 L 296.02,128.28 L 294.66,128.38 L 293.28,128.47 L 291.89,128.57 L 290.48,128.66 L 289.05,128.76 L 287.60,128.86 L 286.14,128.96 L 284.66,129.06 L 283.17,129.16 L 281.66,129.26 L 280.13,129.36 L 278.59,129.46 L 277.04,129.56 L 275.47,129.66 L 273.89,129.76 L 272.29,129.86 L 270.69,129.96 L 269.06,130.06 L 267.43,130.16 L 265.78,130.26 L 264.12,130.36 L 262.45,130.46 L 260.76,130.56 L 259.07,130.66 L 257.36,130.76 L 255.64,130.86 L 253.91,130.96 L 252.17,131.06 L 250.42,131.16 L 248.66,131.26 L 246.89,131.35 L 245.11,131.45 L 243.32,131.55 L 241.52,131.64 L 239.72,131.74 L 237.90,131.83 L 236.08,131.92 L 234.25,132.02 L 232.41,132.11 L 230.56,132.20 L 228.71,132.29 L 226.85,132.38 L 224.99,132.46 L 223.11,132.55 L 221.24,132.63 L 219.35,132.72 L 217.46,132.80 L 215.57,132.88 L 213.67,132.96 L 211.76,133.04 L 209.86,133.12 L 207.94,133.19 L 206.03,133.27 L 204.11,133.34 L 202.18,133.41 L 200.26,133.48 L 198.33,133.55 L 196.40,133.61 L 194.46,133.68 L 192.53,133.74 L 190.59,133.80 L 188.65,133.86 L 186.71,133.92 L 184.77,133.97 L 182.83,134.03 L 180.89,134.08 L 178.95,134.15 L 177.01,134.26 L 175.07,134.36 L 173.13,134.46 L 171.20,134.56 L 169.26,134.65 L 167.33,134.75 L 165.39,134.84 L 163.46,134.93 L 161.54,135.01 L 159.61,135.09 L 157.69,135.17 L 155.77,135.25 L 153.85,135.33 L 151.94,135.40 L 150.03,135.47 L 148.12,135.54 L 146.22,135.60 L 144.32,135.66 L 142.43,135.72 L 140.55,135.78 L 138.67,135.83 L 136.79,135.88 L 134.92,135.93 L 133.06,135.97 L 131.20,136.01 L 129.35,136.05 L 127.51,136.08 L 125.67,136.11 L 123.85,136.14 L 122.03,136.16 L 120.22,136.18 L 118.41,136.20 L 116.62,136.21 L 114.83,136.22 L 113.06,136.23 L 111.29,136.23 L 109.53,136.23 L 107.78,136.23 L 106.05,136.22 L 104.32,136.21 L 102.60,136.19 L 100.90,136.17 L 99.21,136.15 L 97.52,136.12 L 95.85,136.09 L 94.20,136.05 L 92.55,136.01 L 90.92,135.97 L 89.30,135.92 L 87.69,135.86 L 86.10,135.81 L 84.52,135.75 L 82.95,135.68 L 81.40,135.61 L 79.86,135.54 L 78.34,135.46 L 76.83,135.37 L 75.34,135.29 L 73.86,135.19 L 72.40,135.09 L 70.95,134.99 L 69.53,134.89 L 68.11,134.77 L 66.72,134.66 L 65.34,134.54 L 63.98,134.41 L 62.63,134.28 L 61.31,134.14 L 60.00,134.00 Z" fill="#C9A24B" />
              </svg>
              <div className="signature-label">Kalifah.my</div>
              <div className="signature-sub">Tandatangan Digital</div>
            </div>
            <div className="footer-col center">
              <div className="cert-id-label">CERTIFICATE ID</div>
              <div className="cert-id-pill">{certificateId}</div>
            </div>
            <div className="footer-col right">
              <div className="verify-row">
                <div>
                  <div className="verify-label">SAHKAN SIJIL</div>
                  <div className="verify-sub">Imbas QR untuk sahkan keaslian sijil ini.</div>
                </div>
                <div className="qr-wrap">
                  {qrDataUrl ? <img src={qrDataUrl} alt="QR pengesahan sijil" /> : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
