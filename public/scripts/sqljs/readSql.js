const loadDataAS = async (callback) => {    
    
    const sqlPromise = initSqlJs({
        locateFile: (file) => `./scripts/sqljs/sql-wasm.wasm`,
    });
    const dataPromise = fetch("./api/Data.db").then((res) => res.arrayBuffer());
    const [SQL, buf] = await Promise.all([sqlPromise, dataPromise]);
    const db = new SQL.Database(new Uint8Array(buf));
    stmt = db.prepare(
        "SELECT g_data FROM downloaded ORDER BY addSerial DESC  "
    );
    const sqlDatas = {};
    const soretdGID_TOKEN = []
    while (stmt.step()) {
        var row = JSON.parse(stmt.getAsObject().g_data);
        const gid_token = row["gid"] + "_" + row["token"];
        sqlDatas[gid_token] = row
        soretdGID_TOKEN.push(gid_token)
    }
    callback(sqlDatas, soretdGID_TOKEN)
};

window.loadDataLocaly = loadDataAS