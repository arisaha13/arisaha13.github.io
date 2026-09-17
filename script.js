function openSection(evt, sectionName) {
  var tabcontent = document.getElementsByClassName("tabcontent");
  for (var i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
    tabcontent[i].setAttribute("hidden", "");
  }
  var tablinks = document.getElementsByClassName("tablinks");
  for (var i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(" active", "");
    tablinks[i].setAttribute("aria-selected", "false");
    tablinks[i].setAttribute("tabindex", "-1");
  }
  var panel = document.getElementById(sectionName);
  panel.style.display = "block";
  panel.removeAttribute("hidden");
  var btn = evt.currentTarget;
  btn.className += " active";
  btn.setAttribute("aria-selected", "true");
  btn.setAttribute("tabindex", "0");
}

function handleTabKeydown(evt) {
  var moveKeys = ["ArrowLeft", "ArrowRight", "Home", "End"];
  if (moveKeys.indexOf(evt.key) === -1) return;

  var tabs = Array.prototype.slice.call(document.querySelectorAll('[role="tab"]'));
  var currentIndex = tabs.indexOf(document.activeElement);
  if (currentIndex === -1) return;

  var newIndex = currentIndex;
  if (evt.key === "ArrowRight") newIndex = (currentIndex + 1) % tabs.length;
  if (evt.key === "ArrowLeft") newIndex = (currentIndex - 1 + tabs.length) % tabs.length;
  if (evt.key === "Home") newIndex = 0;
  if (evt.key === "End") newIndex = tabs.length - 1;

  evt.preventDefault();
  tabs[newIndex].focus();
  tabs[newIndex].click();
}

document.querySelectorAll('[role="tab"]').forEach(function (tab) {
  tab.addEventListener("keydown", handleTabKeydown);
});

document.getElementById("tab-Photos").click();
