const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 8000;

// Multer storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, 'uploads'));
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});

const upload = multer({ storage: storage });

// Middleware setup
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes

// Home route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "index.html"));
});

// Single file upload routes
app.route("/upload")
  .get((req, res) => {
    res.sendFile(path.join(__dirname, "views", "upload.html"));
  })
  .post(upload.single("file"), (req, res) => {
    if (!req.file) {
      return res.status(400).send("No file uploaded.");
    }
    console.log(`File uploaded successfully: ${req.file.filename}`);
    res.send(`File uploaded successfully: ${req.file.filename}`);
  });

// Multiple file upload routes
app.route("/upload-multiple")
  .get((req, res) => {
    res.sendFile(path.join(__dirname, "views", "upload-multiple.html"));
  })
  .post(upload.array("files", 15), (req, res) => {
    if (!req.files || req.files.length === 0) {
      return res.status(400).send("No files uploaded.");
    }
    const filePaths = req.files.map((file) => file.filename);
    console.log(`Files uploaded successfully: ${filePaths.join(", ")}`);
    res.status(200).send(`Files uploaded successfully: ${filePaths.join(", ")}`);
  });

// Fetch single random image
app.get("/fetch-single", (req, res) => {
  let upload_dir = path.join(__dirname, "uploads");
  let uploads = fs.readdirSync(upload_dir);
  if (uploads.length === 0) {
    return res.status(503).send({ message: "No images" });
  }
  let index = Math.floor(Math.random() * uploads.length);
  let randomImage = uploads[index];
  res.sendFile(path.join(upload_dir, randomImage));
});

// Single random image view route
app.get("/single", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "single.html"));
});

// Fetch multiple random images
app.get('/fetch-multiple-images', (req, res) => {
  const uploadDir = path.join(__dirname, 'uploads');
  fs.readdir(uploadDir, (err, files) => {
      if (err) {
          console.error('Error reading directory:', err);
          return res.status(500).send('Error reading directory');
      }
      if (files.length === 0) {
          return res.status(503).send({ message: 'No Images Found' });
      }
      let count = Math.min(req.query.count || 5, files.length);
      let randomImages = [];
      while (randomImages.length < count) {
          let index = Math.floor(Math.random() * files.length);
          let selectedImage = files.splice(index, 1)[0];
          randomImages.push(selectedImage);
      }
      console.log("Multiple images fetched:", randomImages);
      res.json(randomImages);
  });
});

// Multiple random images view route
app.get("/multiple", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "fetchmultiple.html"));
});

// Fetch all images
app.get('/fetch-all', (req, res) => {
  const uploadDir = path.join(__dirname, 'uploads');
  fs.readdir(uploadDir, (err, files) => {
    if (err) {
      console.error('Error reading directory:', err);
      return res.status(500).send('Error reading directory');
    }
    if (files.length === 0) {
      return res.status(503).send({ message: 'No Images Found' });
    }
    res.json(files);
  });
});

// Gallery view route
app.get('/gallery', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'gallery.html'));
});

// Pagination route for gallery
app.get('/fetch-all/pages/:index', (req, res) => {
  const ITEMS_PER_PAGE = parseInt(req.query.items_per_page, 10) || 5;
  const pageIndex = parseInt(req.params.index, 10);

  if (isNaN(pageIndex) || pageIndex < 1) {
    console.error('Invalid page index:', pageIndex);
    return res.status(400).send('Invalid page index.');
  }

  const allFiles = fs.readdirSync(path.join(__dirname, 'uploads'));

  const totalItems = allFiles.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  if (pageIndex > totalPages) {
    console.error('Page not found:', pageIndex);
    return res.status(404).send('Page not found.');
  }

  const startIndex = (pageIndex - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalItems);
  const pageItems = allFiles.slice(startIndex, endIndex);

  const response = {
    page: pageIndex,
    totalPages: totalPages,
    files: pageItems,
  };

  res.json(response);
});

// Gallery with pagination view route
app.get('/gallery-pagination', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'gallery-pagination.html'));
});

// 404 Route
app.use((req, res) => {
  res.status(404).send("Route not found");
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
