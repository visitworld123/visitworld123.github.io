# Study by the Bay — Zhiqin (Brian) Yang's homepage

An interactive seaside study over HKUST's Clear Water Bay. A glanceable overview
card shows the essentials up front; click **Explore the 3D study** (or any nav
item / glowing marker) to walk the room by teleporting between viewpoints.
Built with plain Three.js (CDN, no build step).

## Run locally

ES modules need to be served over HTTP (not opened as a `file://`):

```bash
cd zhiqinyang.github.io-main
python3 -m http.server 8000
# then open http://localhost:8000
```

Deploy: push to a GitHub Pages repo (e.g. `zhiqinyang.github.io`). `.nojekyll`
is already included.

## Files

- `index.html` — page shell, overview card, all text sections, 2D fallback.
- `js/data.js` — **content: `PAPERS` + `NEWS` (edit this to update the site).**
- `js/main.js` — the 3D scene, teleport camera, panels (renders from `data.js`).
- `css/style.css` — styling (HKUST navy + coral, sea palette).
- `images/profile.jpg` — portrait. `images/papers/<key>.jpg` — paper teasers.
  `images/topics/<key>.jpg` — optional overview-tile pictures.

## How to add a paper

1. Open `js/data.js`, copy one object in the `PAPERS` array, and edit it:
   ```js
   { key:'yang2027foo',            // any unique id
     topic:'reasoning',            // which zone/wall: reasoning | agents | collab | others
     title:'...', authors:['Zhiqin Yang', '...'],
     venue:'ICML 2027', year:2027,
     abstract:'...',
     links:{ pdf:'https://arxiv.org/pdf/....', code:'', web:'' },
     img:'images/papers/foo.png',  // the figure — see below
     selected:true,                // optional: sorts it first in the panel / 2D list
     wall:false },                 // optional: keep it in the list but OFF the 3D wall
   ```
2. **Image:** drop any image into `images/papers/` and set `img:` to its path
   (any name/extension, e.g. `images/papers/foo.png`). If you omit `img`, it tries
   `images/papers/<key>.jpg`; if that's missing, a colored placeholder shows.

**Which wall a paper lands on = its `topic`.** The four zones are defined in `TOPICS`
(top of `data.js`): `reasoning` & `agents` share the east wall, `collab` & `others`
share the south wall. Change a paper's `topic` to move it to another zone. Set
`wall:false` for papers you want listed (in the panel / 2D) but not framed on the wall
(e.g. under-review). No other edits — walls, panel tabs, and counts update automatically.

## How to add news

Prepend one object to the top of the `NEWS` array in `js/data.js` (newest first):
```js
{ date:'2027-01-15', html:'Something new — <a href="...">link</a>.' },
```
The two most recent show on the News wall; all show in the News panel.

## Provide the real paper teaser images

Filenames expected in `images/papers/` (one per paper, `<bibkey>.jpg`):

- reasoning: `yang2026cpo` · `li2025learnalign` · `yang2026shaping`
- agents: `yang2026clawnet` · `zhang2026memfly` · `liu2025ir3d`
- collab: `yang2025fedgps` · `yang2024fedfed` · `wen2026fedrg` · `zhangrobust` · `ji2024emerging`
- others: `wang2025humandreamer` · `liu2025hide` · `yang2023rosgas` · `yang2026SeInEvent` · `cai2023efficient`

Optionally add `images/topics/{reasoning,agents,collab,others}.jpg` to give the
overview tiles real background pictures.

## Guestbook (Supabase — free, no server)

The Guestbook (📖 lectern in the study, or the nav "Guestbook") lets anyone leave
a message, no login. Until you connect it, it shows "not connected yet". To turn it on:

1. Create a free project at <https://supabase.com>.
2. In the project → **SQL Editor**, run:
   ```sql
   create table guestbook (
     id bigint generated always as identity primary key,
     name text,
     message text not null,
     created_at timestamptz default now()
   );
   alter table guestbook enable row level security;
   create policy "anyone can read"  on guestbook for select using (true);
   create policy "anyone can write" on guestbook for insert with check (
     char_length(message) between 1 and 280 and char_length(coalesce(name,'')) <= 40
   );
   ```
3. In **Project Settings → API**, copy the **Project URL** and the **anon public** key.
4. Paste them into `js/data.js`:
   ```js
   const GUESTBOOK = { url: 'https://xxxx.supabase.co', anonKey: 'eyJhbGc...', table: 'guestbook' };
   ```

The `anon` key is safe to ship in the page (that's its purpose); the RLS policies above
keep writes limited to short name/message inserts. To moderate, delete rows in the
Supabase table editor. For spam protection later, add Supabase's built-in rate limits
or a hCaptcha/Turnstile check.
