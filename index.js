const $force = document.querySelectorAll("#force")[0];
const $touches = document.querySelectorAll("#touches")[0];
const canvas = document.querySelectorAll("canvas")[0];
const renderSvgBtn = document.querySelectorAll(".render-btn")[0];
const renderContainer = document.querySelectorAll(".render-container")[0];
const toggleBtn = document.querySelectorAll(".toggle-btn")[0];
const context = canvas.getContext("2d");
let lineWidth = 0;
let isMousedown = false;
let points = [];
let isPointsVisible = false;

canvas.width = (window.innerWidth * 2) / 3;
canvas.height = window.innerHeight;

const parseValue = (value) => parseFloat(value.toFixed(3));

const drawCubicBezier = (points) =>
  points
    // .map(({ x, y }, index, array) =>
    //   index % 3 === 0 ? `C ${x} ${y},` : `${x} ${y},`
    // )
    .map(({ x, y }, index, array) => {
      const prevPoint = array[index - 1];
      const nextPoint = array[index + 1];
      if (!prevPoint || !nextPoint) {
        return "";
      }

      const xc1 = (x + prevPoint.x) / 2;
      const yc1 = (y + prevPoint.y) / 2;
      const xc2 = (x + nextPoint.x) / 2;
      const yc2 = (y + nextPoint.y) / 2;

      return `C ${xc1} ${yc1}, ${x} ${y}, ${xc2} ${yc2}`;
    })
    .join(" ");
const drawQuadraticBezier = (points) =>
  points
    // .map(({ x, y }, index) => (index % 2 === 0 ? `Q ${x} ${y},` : `${x} ${y},`))
    .map(({ x, y }, index, array) => {
      const nextPoint = array[index + 1];
      if (!nextPoint) {
        return "";
      }

      const xc = (x + nextPoint.x) / 2;
      const yc = (y + nextPoint.y) / 2;

      return `Q ${x} ${y}, ${xc} ${yc}`;
    })
    .join(" ");
const drawStraight = (points) =>
  points.map(({ x, y }) => `L ${x} ${y}`).join(" ");

const strategyMap = [
  { stroke: "red", func: drawStraight, name: "straight lines" },
  { stroke: "green", func: drawCubicBezier, name: "bezier curves" },
  { stroke: "blue", func: drawQuadraticBezier, name: "quadratic curves" },
];

const handlePointsToggle = () => {
  if (!isPointsVisible) {
    isPointsVisible = true;
    drawPoints();
  }
};

const createPath = (points, strategy = 0) => {
  if (!points.length) {
    return "";
  }

  const { x, y, lineWidth } = points[0];
  const rest = points.slice(1);
  const { stroke, func: strategyFunc } = strategyMap[strategy];
  const d = strategyFunc(rest);

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("fill", "none");
  path.setAttribute("stroke", stroke);
  path.setAttribute("stroke-width", lineWidth);
  path.setAttribute("stroke-linecap", "round");
  path.setAttribute("d", `M ${x} ${y} ${d}`);

  return path;
};

const createSvg = () => {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "rendered-svg");
  svg.setAttribute("viewBox", `0 0 ${canvas.width} ${canvas.height}`);
  svg.setAttribute("version", "1.1");
  svg.setAttribute("width", "100%");
  svg.setAttribute("height", "100%");

  return svg;
};

const renderSVG = (strategy = 0) => {
  console.log(points);

  if (!points.length) {
    return;
  }

  const div = document.createElement("div");
  div.classList.add("svg-container");

  const label = document.createElement("span");
  label.textContent = strategyMap[strategy].name;

  const svg = createSvg();
  const path = createPath(points, strategy);

  svg.appendChild(path);

  div.appendChild(label);
  div.appendChild(svg);

  renderContainer.appendChild(div);
};

const renderAllSvg = () => {
  renderSVG(0);
  renderSVG(1);
  renderSVG(2);
};

renderSvgBtn.addEventListener("click", renderAllSvg);
toggleBtn.addEventListener("click", handlePointsToggle);

const requestIdleCallback =
  window.requestIdleCallback ||
  function (fn) {
    setTimeout(fn, 1);
  };

for (const ev of ["touchstart", "mousedown"]) {
  canvas.addEventListener(ev, function (e) {
    let pressure = 0.1;
    let x, y;
    if (
      e.touches &&
      e.touches[0] &&
      typeof e.touches[0]["force"] !== "undefined"
    ) {
      if (e.touches[0]["force"] > 0) {
        pressure = e.touches[0]["force"];
      }
      x = e.touches[0].pageX * 2;
      y = e.touches[0].pageY * 2;
    } else {
      pressure = 1.0;
      x = e.pageX * 2;
      y = e.pageY * 2;
    }

    isMousedown = true;

    lineWidth = Math.log(pressure + 1) * 40;
    context.lineWidth = lineWidth; // pressure * 50;
    context.strokeStyle = "black";
    context.lineCap = "round";
    context.lineJoin = "round";
    context.beginPath();
    context.moveTo(x, y);

    points.push({ x, y, lineWidth });
  });
}

for (const ev of ["touchmove", "mousemove"]) {
  canvas.addEventListener(ev, function (e) {
    if (!isMousedown) return;
    e.preventDefault();

    let pressure = 0.1;
    let x, y;
    if (
      e.touches &&
      e.touches[0] &&
      typeof e.touches[0]["force"] !== "undefined"
    ) {
      if (e.touches[0]["force"] > 0) {
        pressure = e.touches[0]["force"];
      }
      x = e.touches[0].pageX * 2;
      y = e.touches[0].pageY * 2;
    } else {
      pressure = 1.0;
      x = e.pageX * 2;
      y = e.pageY * 2;
    }

    // smoothen line width
    lineWidth = Math.log(pressure + 1) * 40 * 0.2 + lineWidth * 0.8;
    points.push({ x, y, lineWidth });

    context.strokeStyle = "black";
    context.lineCap = "round";
    context.lineJoin = "round";
    // context.lineWidth   = lineWidth// pressure * 50;
    // context.lineTo(x, y);
    // context.moveTo(x, y);

    if (points.length >= 3) {
      const l = points.length - 1; // Get the last added point's index
      const xc = (points[l].x + points[l - 1].x) / 2; // get the midpoint x between the last two points
      const yc = (points[l].y + points[l - 1].y) / 2; // get the midpoint y between the last two points
      context.lineWidth = points[l - 1].lineWidth;
      context.quadraticCurveTo(points[l - 1].x, points[l - 1].y, xc, yc);
      context.stroke();
      context.beginPath();
      context.moveTo(xc, yc);
    }

    requestIdleCallback(() => {
      $force.textContent = "force = " + pressure;

      const touch = e.touches ? e.touches[0] : null;
      if (touch) {
        $touches.innerHTML = `
          touchType = ${touch.touchType} ${
          touch.touchType === "direct" ? "👆" : "✍️"
        } <br/>
          radiusX = ${touch.radiusX} <br/>
          radiusY = ${touch.radiusY} <br/>
          rotationAngle = ${touch.rotationAngle} <br/>
          altitudeAngle = ${touch.altitudeAngle} <br/>
          azimuthAngle = ${touch.azimuthAngle} <br/>
        `;

        // 'touchev = ' + (e.touches ? JSON.stringify(
        //   ['force', 'radiusX', 'radiusY', 'rotationAngle', 'altitudeAngle', 'azimuthAngle', 'touchType'].reduce((o, key) => {
        //     o[key] = e.touches[0][key]
        //     return o
        //   }, {})
        // , null, 2) : '')
      }
    });
  });
}

const drawPoints = () => {
  points.forEach(({ x, y }) => {
    context.fillStyle = "red";
    context.fillRect(x - 10, y - 10, 20, 20);
  });
};

for (const ev of ["touchend", "touchleave", "mouseup"]) {
  canvas.addEventListener(ev, function (e) {
    let pressure = 0.1;
    let x, y;

    if (
      e.touches &&
      e.touches[0] &&
      typeof e.touches[0]["force"] !== "undefined"
    ) {
      if (e.touches[0]["force"] > 0) {
        pressure = e.touches[0]["force"];
      }
      x = e.touches[0].pageX * 2;
      y = e.touches[0].pageY * 2;
    } else {
      pressure = 1.0;
      x = e.pageX * 2;
      y = e.pageY * 2;
    }

    isMousedown = false;

    context.strokeStyle = "black";
    context.lineCap = "round";
    context.lineJoin = "round";

    if (points.length >= 3) {
      const l = points.length - 1;
      context.quadraticCurveTo(points[l].x, points[l].y, x, y);
      context.stroke();
    }

    // points = []
    lineWidth = 0;
  });
}
