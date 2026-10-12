# Occasioni.online

Sito statico in italiano per guide sui metodi di guadagno online e una directory di programmi di affiliazione. Le guide, le categorie e i programmi sono salvati in JSON nella cartella `data/` e gestibili da Decap CMS.

## Aree del sito

- `guide.html`: Guide e Blog, con ricerca, categorie e anteprime degli articoli gestiti dal CMS.
- `opportunita.html`: categorie delle guide, settori e programmi di affiliazione, tutti letti dai JSON CMS.
- `community.html`: hub informativo; discussioni e risposte non sono ancora attive.
- `market.html`: interfaccia demo per gli annunci. Il modulo genera un’anteprima temporanea nel browser, ma non invia né salva dati. Per pubblicare annunci moderati servirà collegare un backend.

## Avvio locale

Dalla cartella del progetto avvia un server statico:

```bash
python3 -m http.server 4173
```

Apri `http://localhost:4173`. Il server è necessario perché le pagine Guide / Blog e Categorie / Programmi caricano i JSON con `fetch`.

## Gestione contenuti

Apri `/admin/` dopo aver collegato Decap Turbo al repository. La configurazione `admin/config.yml` espone tre raccolte:

- `data/categories.json`: categorie delle guide (`type: guide`) e settori della directory (`type: sector`). Ogni ID deve essere univoco.
- `data/articles.json`: articoli con ID univoco, titolo, ID categoria, sommario, copertina, testo, punti chiave, tag e stato di pubblicazione.
- `data/programs.json`: programmi con ID stabile e univoco, descrizione, sito ufficiale HTTPS, tag, ID dei settori e stato di pubblicazione.

Quando aggiungi un articolo o un programma, usa in `category_id` o `categories` gli ID già presenti nella raccolta Categorie. Le categorie e i filtri della homepage sono generati da questi dati.

Le anteprime della homepage rimandano alle schede complete `articolo.html?id=<id>` e `programma.html?id=<id>`. Gli ID devono rimanere stabili perché fanno parte degli URL condivisibili. Il testo di un articolo può contenere più paragrafi separati da una riga vuota; le schede di programmi senza ID o senza URL HTTPS non mostrano il collegamento alla scheda o al sito ufficiale.

La configurazione mantiene il backend GitHub e il Site ID già presenti nel progetto. Prima della pubblicazione verifica in `admin/config.yml` che repository e sito Decap Turbo siano quelli destinati a Occasioni.online. I vecchi `data/site.json`, `data/products.json` e i file `shop.css` e `shop.js` appartengono al prototipo Cartaway e non sono usati dalle raccolte editoriali.

I programmi iniziali sono esempi da verificare e i link non sono tracciati. Prima di monetizzare, aggiorna i dati e aggiungi informativa pubblicitaria, privacy, cookie e le informazioni legali applicabili. I contenuti hanno finalità informative, non costituiscono consulenza finanziaria, fiscale o legale e non garantiscono risultati.