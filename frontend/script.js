document.getElementById('imageInput').addEventListener('change', function(event) {
    var canvas = new fabric.Canvas('canvas');
  
    var img = new Image();
    var reader = new FileReader();
    reader.onload = function(event) {
      img.onload = function() {
        var fabricImg = new fabric.Image(img, {
          left: 0,
          top: 0,
          originX: 'left',
          originY: 'top',
          selectable: false // Disable selection and movement of the image
        });
  
        // Scale canvas to match image dimensions
        canvas.setWidth(fabricImg.width);
        canvas.setHeight(fabricImg.height);
  
        // Add the image to the canvas and render
        canvas.add(fabricImg);
        canvas.renderAll();
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(event.target.files[0]);
  
    var rect, isDrawing = false;
    var popupDiv = null;
    var activeRect = null;
    var activeRectIndex = -1;
  
    // Disable default panning behavior of Fabric.js
    canvas.on('mouse:down', function(options) {
      if (options.target && options.target.type === 'rect') {
        isDrawing = false;
        activeRect = options.target;
        activeRectIndex = canvas.getObjects().indexOf(activeRect);
        if (activeRect.width > 10 && activeRect.height > 10) {
          showPopup(activeRect.left + (activeRect.width + activeRect.height) * 1.25, activeRect.top + activeRect.height * 1.5, activeRect.text || '', true);
        }
      } else if (options.target && options.target.type === 'image') {
        isDrawing = true;
        var pointer = canvas.getPointer(options.e);
        rect = new fabric.Rect({
          left: pointer.x,
          top: pointer.y,
          width: 0,
          height: 0,
          fill: 'transparent',
          stroke: 'red',
          strokeWidth: 2,
          selectable: false,
          text: '' // Initialize the text property of the rect
        });
        canvas.add(rect);
        activeRect = rect;
        activeRectIndex = -1;
      } else {
        // If clicked on empty area, hide the popup
        hidePopup();
      }
    });
  
    canvas.on('mouse:move', function(options) {
      if (!isDrawing) return;
      var pointer = canvas.getPointer(options.e);
      rect.set({ width: pointer.x - rect.left, height: pointer.y - rect.top });
      canvas.renderAll();
    });
  
    canvas.on('mouse:up', function() {
      if (isDrawing) {
        isDrawing = false;
        activeRect.setCoords();
        activeRect.set({ selectable: true }); // Allow resizing of the rectangles
        activeRect.set({ hasBorders: true, cornerColor: 'red', cornerSize: 12 }); // Customize rectangle corners
        if (activeRect.width > 10 && activeRect.height > 10) {
          showPopup(activeRect.left + (activeRect.width + activeRect.height) * 1.25, activeRect.top + activeRect.height * 1.5, activeRect.text || '', false);
          canvas.renderAll();
        } else {
          canvas.remove(activeRect);
        }
      }
    });
  
    canvas.on('mouse:down:before', function() {
      if (popupDiv) {
        hidePopup();
      }
    });
  
    document.getElementById('deleteButton').addEventListener('click', function() {
      var activeObject = canvas.getActiveObject();
      if (activeObject && activeObject.type === 'rect') {
        canvas.remove(activeObject);
        canvas.renderAll();
        hidePopup();
      }
    });
  
    document.addEventListener('keydown', function(event) {
      if (event.key === 'Delete') {
        var activeObject = canvas.getActiveObject();
        if (activeObject && activeObject.type === 'rect') {
          canvas.remove(activeObject);
          canvas.renderAll();
          hidePopup();
        }
      }
    });
  
    document.getElementById('saveButton').addEventListener('click', function() {
      var annotations = [];
      canvas.forEachObject(function(obj) {
        if (obj.type === 'rect' && obj.width > 10 && obj.height > 10) {
          var annotation = {
            x: obj.left,
            y: obj.top,
            width: obj.width,
            height: obj.height,
            angle: obj.angle, // Save the angle of the bounding box
            text: obj.text || '' // Save the text associated with the bounding box (or empty string if not set)
          };
          annotations.push(annotation);
        }
      });
      var jsonData = {
        name: event.target.files[0].name,
        annotations: annotations
      };
      console.log(JSON.stringify(jsonData));

      fetch('/annotations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(jsonData)
      })
        .then(response => response.json())
        .then(data => {
          console.log('Annotation saved:', data);
          // Perform any necessary actions after successful save
        })
        .catch(error => {
          console.error('Error saving annotation:', error);
          // Handle the error case
        });
    });
  
    function showPopup(x, y, text, reOpen) {
      if (popupDiv && !reOpen) return; // Popup is already open for the active object
      hidePopup();
  
      popupDiv = document.createElement('div');
      popupDiv.setAttribute('class', 'popup');
      popupDiv.style.left = x + 'px';
      popupDiv.style.top = y + 'px';
  
      var inputBox = document.createElement('input');
      inputBox.setAttribute('type', 'text');
      inputBox.setAttribute('class', 'popup-input');
      inputBox.setAttribute('placeholder', 'Enter text');
      inputBox.value = text;
  
      var saveButton = document.createElement('button');
      saveButton.setAttribute('class', 'popup-button');
      saveButton.innerText = 'Save';
      saveButton.addEventListener('click', function() {
        activeRect.text = inputBox.value;
        canvas.renderAll();
        hidePopup();
      });
  
      popupDiv.appendChild(inputBox);
      popupDiv.appendChild(saveButton);
      document.body.appendChild(popupDiv);
  
      inputBox.focus();
    }
  
    function hidePopup() {
      if (popupDiv) {
        document.body.removeChild(popupDiv);
        popupDiv = null;
        activeRect = null;
        activeRectIndex = -1;
      }
    }
  });
  