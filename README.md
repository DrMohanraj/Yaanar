# யாணர் — நேர்காணல் இணைய இதழ்

Build எதுவும் இல்லாத நிலையான தளம் (HTML/CSS/JS) + Cloudflare Pages Functions.
வடிவமைப்பு: நீங்கள் கொடுத்த reference-glow-homepage (cream + teal, DM Serif Display / Jost; தமிழுக்கு Noto Serif/Sans Tamil).

## அமைப்பு
```
public/            ← தளம் (Cloudflare "build output directory")
  index.html  interview.html  collection.html  search.html  about.html
  admin/ (index.html, reindex.html)
  data/  site.json  interviews.json  search-index.json  embeddings.json
functions/api/     ← உள்நுழைவு, சேமிப்பு, படப் பதிவேற்றம், reindex, AI தேடல்
wrangler.toml
```
## பக்கங்கள்
- **முகப்பு**: hero படமும் பெரிய எழுத்துகளும் `site.json → featuredId` நேர்காணலிலிருந்து வரும்; எழுத்துகள் குதித்து வரும். கீழ்வரிசை/பக்கப்பட்டை: மற்ற நேர்காணல்கள்.
- **நேர்காணல்**: அறிமுகம் + 20 கேள்வி–பதில்; ஒவ்வொரு பதிலின் முக்கிய வரி பெரிய "splash" மேற்கோளாகத் தெறிக்கும்.
- **தொகுப்பு**: அட்டைகள், வகை வடிகட்டி, பெயர்/தலைப்புத் தேடல்.
- **ஆய்வுத் தேடல்**: சொல் வடிவங்கள் (சாதி, சாதியை, சாதியம்…) + AI தொடர்புடைய பகுதிகள்; எழுத்தாளர் வாரியாகத் தொகுப்பு; மேற்கோள் குறிப்பு; "முழு நேர்காணல்" இணைப்பு.
- **எங்களைப் பற்றி**: 1 முதன்மை + 4 துணை ஆசிரியர்கள் (புகைப்படத்துடன்).

## வெளியிடும் படிகள்
1. இந்தக் கோப்புறையை GitHub-ல் புதிய repo ஆக ஏற்றவும்.
2. `wrangler.toml`-ல் `GITHUB_REPO`, `ALLOWED_USERS` (உங்கள் GitHub பெயர்) நிரப்பவும்.
3. GitHub → Settings → Developer settings → **OAuth Apps → New**:
   Homepage = உங்கள் தள முகவரி; Callback = `https://உங்கள்-தளம்/api/auth/callback`. Client ID-ஐ `wrangler.toml`-ல் `GITHUB_CLIENT_ID` ஆக இடவும்.
4. GitHub → **Fine-grained token**: இந்த repo-க்கு மட்டும், *Contents: Read and write*.
5. Cloudflare → Workers & Pages → Create → Pages → Connect to Git: Build command **காலி**, Output directory **`public`**.
6. Pages → Settings → Variables and Secrets (Secret ஆக): `GITHUB_CLIENT_SECRET`, `SESSION_SECRET` (நீண்ட ரகசிய சொற்றொடர்), `GITHUB_TOKEN` (படி 4).
7. AI: `wrangler.toml`-ல் `[ai] binding = "AI"` உள்ளது (Workers AI கணக்கில் இயக்கப்பட்டிருக்க வேண்டும்).
8. தளம் திறந்து `/admin` → GitHub மூலம் உள்நுழை → ஒரு நேர்காணல் சேமி → `/admin/reindex.html` → "புதுப்பி".

## ஆய்வாளர் உதவி (Cloudflare AI Search)
தேடல் பக்கத்தின் கீழே உள்ள "ஆய்வாளர் உதவி" `/api/ask` மூலம் வேலை செய்யும். ஒருமுறை அமைக்க வேண்டியவை (இந்த வரிசையில்):
1. Cloudflare → R2 → **Create bucket** → பெயர் `yaanar-interviews`. பிறகு `wrangler.toml`-ல் `[[r2_buckets]]` பகுதியின் 3 வரிகளின் `#`-ஐ நீக்கி, `public/assets/js/search.js`-ல் `ASK_ENABLED = true` ஆக்கவும். (இப்போது இவை முடக்கப்பட்டுள்ளன; bucket இல்லாமல் binding-ஐ இயக்கினால் deploy தோல்வியடையும்.)
2. Push செய்து deploy முடிந்ததும் `/admin/reindex.html` → "புதுப்பி". ஒவ்வொரு கேள்வி–பதிலும் bucket-ல் `<id>/q-NN.md` கோப்பாக எழுதப்படும்.
3. Cloudflare → AI → **AI Search** → Create → Data source: R2 bucket `yaanar-interviews` → பெயர் `yaanar-interviews` (`wrangler.toml` → `AI_SEARCH_NAME`).
4. AI Search குறியிட்டு முடிந்ததும் (Overview-ல் நிலை தெரியும்) தேடல் பக்கத்தில் கேள்வி கேட்டுச் சோதிக்கவும்.

புதிய நேர்காணல் சேர்த்த பின் reindex செய்தால் R2 கோப்புகள் புதுப்பிக்கப்படும்; AI Search அவற்றைத் தானாக மீண்டும் குறியிடும் (உடனே வேண்டுமெனில் AI Search → Sync).

## தினசரிப் பயன்பாடு
- புதிய நேர்காணல்: `/admin` → ＋ புதிய நேர்காணல் → படிவம் நிரப்பு → "முகப்பில் சிறப்பாகக் காட்டு" தேர்வு → சேமி → தேடல் குறியீட்டைப் புதுப்பி.
- ஒவ்வொரு சேமிப்பும் GitHub commit; Cloudflare 1–2 நிமிடத்தில் தானாக வெளியிடும்.
- Splash வரி: பதிலிலிருந்து அப்படியே நகலெடுத்த சொற்றொடர் (எச்சரிக்கை காட்டும்).
- hero எழுத்துகள்: 3 குறுகிய வரிகள்; காலியாக விட்டால் முதல் கேள்வியின் முக்கிய வரியிலிருந்து தானாக.

## உள்ளூரில் சோதனை
- `cd public && python3 -m http.server 8000` → தளம், சொல் தேடல் வேலை செய்யும் (admin/AI இல்லை).
- முழுமையாக: `.dev.vars.example` → `.dev.vars`, பின் `npx wrangler pages dev`.

## குறிப்புகள்
- `data/*.json`-ல் உள்ள பெயர்கள், பதில்கள், குழுப் புகைப்படங்கள் **மாதிரிகள்** (reference படங்கள்). நிர்வாகத்தில் மாற்றவும்.
- AI தேடல் வரம்பு: `functions/api/search.js` → `MIN_SCORE` (0.45); குறைத்தால் அதிகப் பகுதிகள் வரும்.
- சொல் வடிவத் தேடல் விதி அடிப்படையிலானது (`assets/js/search.js` → `candidates`); தேவையான புதிய விகுதிகளை அங்கே சேர்க்கலாம்.
- Google Fonts இணையத்திலிருந்து ஏற்றப்படும்.
