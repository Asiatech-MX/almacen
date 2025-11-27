async function test() {
  console.log("Start testing imports");
  try {
    await import("express");
    console.log("express ok");

    await import("./config/web-api.cjs");
    console.log("config ok");

    await import("./routes/proveedores.routes");
    console.log("proveedoresRoutes ok");

    await import("morgan");
    console.log("morgan ok");

    await import("./server");
    console.log("server ok");

    console.log("All imports ok");
  } catch (e) {
    console.error("Error importing:", e);
  }
}
test();
