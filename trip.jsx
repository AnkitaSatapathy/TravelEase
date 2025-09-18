document.getElementById("tripForm").addEventListener("submit", function(event) {
  event.preventDefault(); // prevent actual submission

  const formData = new FormData(event.target);
  const data = Object.fromEntries(formData.entries());

  console.log("User Input:", data);

  alert("Your inputs have been recorded! (Trip plan generation will come here)");
});
