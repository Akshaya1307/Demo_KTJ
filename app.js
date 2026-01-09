async function run() {
  const narrative = document.getElementById("narrative").value;
  const backstory = document.getElementById("backstory").value;

  const res = await fetch("/.netlify/functions/bdhReasoner", {
    method: "POST",
    body: JSON.stringify({ narrative, backstory })
  });

  const data = await res.json();
  document.getElementById("out").innerText =
    JSON.stringify(data, null, 2);
}
