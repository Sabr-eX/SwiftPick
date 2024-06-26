import React from "react";

function Sidebar() {
  return (
    <div class="sidebar">
      <div class="w3-sidebar w3-bar-block" style={{width: 0.25}}>
        <a href="#" class="w3-bar-item w3-button">
          Link 1
        </a>
        <a href="#" class="w3-bar-item w3-button">
          Link 2
        </a>
        <a href="#" class="w3-bar-item w3-button">
          Link 3
        </a>
      </div>

      <div style="margin-left:25%">... page content ...</div>
    </div>
  );
}

export default Sidebar;
