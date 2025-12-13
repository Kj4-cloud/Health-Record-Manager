const form = document.getElementById("appointmentForm");
const appointmentList = document.getElementById("appointmentList");

form.addEventListener("submit", function (e) {
  e.preventDefault();

  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const date = document.getElementById("date").value;
  const time = document.getElementById("time").value;
  const reason = document.getElementById("reason").value;

  const li = document.createElement("li");
  li.innerHTML = `
    <strong>${name}</strong><br>
    ${email}<br>
    ${date} at ${time}<br>
    ${reason}
  `;

  appointmentList.appendChild(li);
  form.reset();
});
