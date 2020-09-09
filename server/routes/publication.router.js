const express = require("express");
const pool = require("../modules/pool");
const router = express.Router();
const { rejectUnauthenticated } = require('../modules/authentication-middleware');

/**
 * GET route template
 */
router.get('/', rejectUnauthenticated, (req, res) => {
  console.log('Getting Publications')
  const queryText = `
  SELECT * FROM publication
  ORDER BY title ASC`
  pool.query(queryText)
  .then( (response) => {
      console.log( 'Successfully got publication data');
      res.send(response.rows);
    })
    .catch((err) => {
      console.log("An error occured while getting bookmarks:", err);
      res.sendStatus(500);
    });
});



router.put('/', rejectUnauthenticated, (req, res) => {
  console.log('Toggling inclusion state of publication #', req.body.id)
  const queryText = `
  UPDATE publication
  SET include = NOT include
  WHERE id = ${req.body.id}
  `
  pool.query(queryText)
  .then( (response) => {
      console.log( 'Successfully toggled inclusion state');
      res.send(response.rows);
  })
  .catch( (err) => {
      console.log('An error occured while toggling inclusion state:', err);
      res.sendStatus(500);
  })
})

//update timestamp 

router.put('/timestamp/:id', rejectUnauthenticated, (req, res) => {
  console.log('update last_searched timestamp');
    pool.query(`UPDATE "publication" 
    SET "last_searched" = CURRENT_TIMESTAMP WHERE id = ${req.params.id};`)
    // pool.query(queryText, queryInput)
    .then(() => res.sendStatus(201))
    .catch((error) => {res.sendStatus(500);
      console.log(error);
      //console.log(req.body)
    });
  });

/**
 * POST route template
 */
router.post("/csv", async (req, res) => {
  const csvData = req.body.payload;
  //console.log("OOOOO", csvData);
  const connection = await pool.connect();
  const notAvailable = "not provided";

  try {
    // for (book of csvData) {
    //   if (book.data.title === undefined) {
    //     console.log("pooooop");
    //   } else {
    //     console.log(book.data.title);
    //   }
    // }
    await connection.query("BEGIN");
    const queryText = `INSERT INTO "publication" ("title", "author1", "subtitle") VALUES ($1, $2, $3);`;

    for (book of csvData) {
      await connection.query(queryText, [
        book.data.title,
        book.data.author,
        book.data.subtitle,
      ]);
    }
    await connection.query("COMMIT");
  } catch (error) {
    await connection.query("ROLLBACK");
    throw error;
  } finally {
    connection.release();
  }
});

module.exports = router;

// switch (book) {
//   case book.data.title === undefined || "":
//     book.data.title = "not provided";
//     break;
//   case book.data.author === undefined:
//     book.data.author = notAvailable;
//     break;
//   case book.data.subtitile === undefined:
//     book.data.subtitle = notAvailable;
//     break;
