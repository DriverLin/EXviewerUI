const loadDataAS = async () => {    
    const sqlPromise = initSqlJs({
        locateFile: (file) => `./scripts/sqljs/sql-wasm.wasm`,
    });
    const dataPromise = fetch("./api/Data.db",{cache:"force-cache"}).then((res) => res.arrayBuffer());
    const [SQL, buf] = await Promise.all([sqlPromise, dataPromise]);
    const db = new SQL.Database(new Uint8Array(buf));
    stmt = db.prepare(
        "SELECT g_data.g_data as g_data,download.addSerial as asddSerial FROM download,g_data where download.gid == g_data.gid ORDER BY addSerial DESC"
    );
    const gallarys = []
    while (stmt.step()) {
        var row = JSON.parse(stmt.getAsObject().g_data);
        gallarys.push(row)
    }
    // callback(sqlDatas, soretdGID_TOKEN)
    return gallarys
};

window.loadDataLocaly = loadDataAS