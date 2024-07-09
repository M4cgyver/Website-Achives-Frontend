import BetterSqlite3 from 'better-sqlite3';

// Database paths
const dViews: BetterSqlite3.Database = BetterSqlite3("databases/views.sqlite3"); // Create a new SQLite database instance for views
const dComments: BetterSqlite3.Database = BetterSqlite3("databases/comments.sqlite3"); // Create a new SQLite database instance for comments

// Run SQL command to create a table (if not exists) for comments
dComments.exec(`
    CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        username TEXT NOT NULL,
        documentId INTEGER NOT NULL,
        content TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);

// Create indexes for userId and documentId columns
dComments.exec(`CREATE INDEX IF NOT EXISTS idx_userId ON comments (userId)`);
dComments.exec(`CREATE INDEX IF NOT EXISTS idx_documentId ON comments (documentId)`);

// Run SQL command to create a table (if not exists) for views
dViews.exec(`
    CREATE TABLE IF NOT EXISTS views (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        documentId INTEGER NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);

// Create indexes for userId and documentId columns
dViews.exec(`CREATE INDEX IF NOT EXISTS idx_userId ON views (userId)`);
dViews.exec(`CREATE INDEX IF NOT EXISTS idx_documentId ON views (documentId)`);

// Functions to interact with the views table
const addViewsStmt: BetterSqlite3.Statement = dViews.prepare('INSERT INTO views (userId, documentId) VALUES (?, ?)');
export const addView = (userId: number, documentId?: number): Promise<BetterSqlite3.RunResult> => {
    return new Promise((res, rej) => {
        try {
            const statement: BetterSqlite3.RunResult = addViewsStmt.run(userId, documentId ?? 0);
            res(statement);
        } catch (error) {
            rej(error);
        }
    });
};

const getViewsStmt: BetterSqlite3.Statement = dViews.prepare('SELECT * FROM views WHERE documentId = ?');
const getViewsStmtUniqueViews: BetterSqlite3.Statement = dViews.prepare('SELECT DISTINCT userId FROM views WHERE documentId = ?');
const getAllViewsStmt: BetterSqlite3.Statement = dViews.prepare('SELECT * FROM views');
export const getViews = (options?: { uniqueViews?: boolean, documentId?: number }): Promise<any[]> => {
    return new Promise((res, rej) => {
        try {
            if (!options || options.documentId == undefined) {
                // If documentId is null or not provided, return all views unless uniqueViews are specified
                if (options && options.uniqueViews) {
                    res(getViewsStmtUniqueViews.all());
                } else {
                    res(getAllViewsStmt.all());
                }
            } else {
                // If documentId is provided, return views for that document
                if (options.uniqueViews) {
                    res(getViewsStmtUniqueViews.all(options.documentId));
                } else {
                    res(getViewsStmt.all(options.documentId));
                }
            }
        } catch (error) {
            rej(error);
        }
    });
};

const countViewsStmt: BetterSqlite3.Statement = dViews.prepare('SELECT COUNT(*) AS count FROM views WHERE documentId = ?');
const countAllWithUniqueViewIdsStmt: BetterSqlite3.Statement = dViews.prepare('SELECT COUNT(DISTINCT userId) AS count FROM views WHERE documentId = ?');
const countAllViewsStmt: BetterSqlite3.Statement = dViews.prepare('SELECT COUNT(*) AS count FROM views');
const countAllViewsWithUniqueViewIdsStmt: BetterSqlite3.Statement = dViews.prepare('SELECT COUNT(DISTINCT userId) AS count FROM views');
export const getViewsCount = (options?: { uniqueViews?: boolean, documentId?: number }): Promise<number> => {
    return new Promise((res, rej) => {
        try {
            if (!options || options.documentId == undefined) {
                // If documentId is null or not provided, return the count of all views
                const countStmt: BetterSqlite3.Statement = options?.uniqueViews ? countAllViewsWithUniqueViewIdsStmt : countAllViewsStmt;
                const result: { count: number } = countStmt.get() as { count: number };
                res(result.count);
            } else {
                // If documentId is provided, return the count of views for that document
                const countStmt: BetterSqlite3.Statement = options?.uniqueViews ? countAllWithUniqueViewIdsStmt : countViewsStmt;
                const result: { count: number } = countStmt.get(options.documentId) as { count: number };
                res(result.count);
            }
        } catch (error) {
            rej(error);
        }
    });
};

// Functions to interact with the comments table
// Prepare the SQL statement for adding a comment
const addCommentStmt: BetterSqlite3.Statement = dComments.prepare('INSERT INTO comments (userId, username, documentId, content) VALUES (?, ?, ?, ?)');
// Function to add a comment
export const addComment = (userId: number, username: string, documentId: number, content: string): Promise<BetterSqlite3.RunResult> => {
    return new Promise((res, rej) => {
        try {
            const statement: BetterSqlite3.RunResult = addCommentStmt.run(userId, username, documentId, content);
            res(statement);
        } catch (error) {
            rej(error);
        }
    });
};

// Prepare the SQL statement for getting comments by documentId
const getCommentsStmt: BetterSqlite3.Statement = dComments.prepare('SELECT * FROM comments WHERE documentId = ? ORDER BY timestamp DESC');
// Function to get comments by documentId
export const getComments = (documentId: number): Promise<any[]> => {
    return new Promise((res, rej) => {
        try {
            const comments: any[] = getCommentsStmt.all(documentId);
            res(comments);
        } catch (error) {
            rej(error);
        }
    });
};
