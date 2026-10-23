# Replace the photo placeholders

No original Figma media have been copied. The page structure remains in editable HTML and CSS.

| Image | Where to add it | Behavior |
|---|---|---|
| Landing background | `public/assets/background.jpg` | Fills the hero; a blue gradient appears until supplied |
| Official school seal | Replace `public/assets/logo.svg` | Used by navigation, sidebar and watermarks; current SVG is an illustrative placeholder |
| Transparent student cutout | `public/assets/students.png` | Set `--students-image` to `url('assets/students.png')` in `public/styles.css` |
| About-page campus photo | `public/assets/campus.jpg` | Automatically replaces the reserved campus rectangle |
| Student/profile photo | `public/assets/profile.jpg` | Add the CSS below to show a shared sample portrait in the reserved circle |

```css
.portrait { background: url('assets/profile.jpg') center / cover no-repeat; }
.portrait svg { visibility: hidden; }
```

For individualized student photos, extend the account data and implement authorized photo storage rather than putting private photos in a shared public folder.

If your school logo is PNG, change the logo `<img>` paths in HTML and the shared sidebar template in `public/portal.js`, plus watermark URLs in `public/portal.css` and `public/profile.css`.

If your landing background already contains the college heading, remove `.school-heading` from `public/index.html`. Adjust `background-position` in `public/styles.css` to match your crop.
