# Cara menambah foto proyek

1. Taruh file di folder proyek, contoh:
   - `assets/img/projects/harmscan/1.jpg`
   - `assets/img/projects/harmscan/2.jpg`
   - `assets/img/projects/harmscan/3.webp`

2. Daftarkan di `assets/js/projects.js` pada field `images`:

```js
images: [
  "./assets/img/projects/harmscan/1.jpg",
  "./assets/img/projects/harmscan/2.jpg",
  "./assets/img/projects/harmscan/3.webp"
]
```

Satu proyek boleh banyak foto. Galeri di situs akan menampilkan prev/next + thumbnail.
