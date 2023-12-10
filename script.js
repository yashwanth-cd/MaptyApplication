'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
let id = 0;
// Parent Class
class Workout {
  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
  }
}

// Child Class
class Running extends Workout {
  type = 'running';
  currentContent;
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    id++;
    this.id = id;
    this.cadence = cadence;
    this.calcPace();
  }

  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}
class Cycling extends Workout {
  type = 'cycling';
  currentContent;
  constructor(coords, distance, duration, elevGain) {
    super(coords, distance, duration);
    id++;
    this.id = id;
    this.elevGain = elevGain;
    this.calcSpeed();
  }

  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}
///////////////////////////////////////////////////////
// APP CLASS
class App {
  #map;
  #mapEvent;
  #mapZoom = 13;
  #workouts = [];

  constructor(workouts, map) {
    // Get the current location for displaying the map
    this._getPosition();

    // Get the data from local storage
    this._getLocalStorage();
    form.addEventListener('submit', this._newWorkout.bind(this));
    //  Toggling the classes based on the workout type
    inputType.addEventListener('change', this._toggleElevationField);
    containerWorkouts.addEventListener('click', this._moveToWorkout.bind(this));
  }

  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          console.log('FAILURE');
        }
      );
    }
  }

  _loadMap(pos) {
    const { latitude } = pos.coords;
    const { longitude } = pos.coords;
    const coords = [latitude, longitude];

    this.#map = L.map('map').setView(coords, this.#mapZoom);

    L.tileLayer('https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    // Handling clicks on the map
    this.#map.on('click', this._showForm.bind(this));

    // Displaying the local storage markers
    this.#workouts.forEach(workout => {
      this._renderWorkoutMarker(workout);
    });
  }

  _showForm(mapEv) {
    this.#mapEvent = mapEv;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _hideForm() {
    inputType.selectedIndex = 0;
    inputDuration.value =
      inputDistance.value =
      inputCadence.value =
      inputElevation.value =
        '';
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  _toggleElevationField() {
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
  }

  // _validateDetails(...inputs) {
  //   return (
  //     !Number.isFinite(distance) ||
  //     !Number.isFinite(duration) ||
  //     !Number.isFinite(final)
  //   );
  // }

  _newWorkout(e) {
    e.preventDefault();

    const validInputs = (...inputs) =>
      inputs.every(input => Number.isFinite(input));
    const allPositives = (...inputs) => inputs.every(input => input > 0);
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;
    const date = new Date();

    // Get the data from the form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;

    // If workout is running, create running object
    if (type === 'running') {
      const cadence = +inputCadence.value;
      // Checking if the input values are valid - guard clause
      if (
        !validInputs(distance, duration, cadence) ||
        !allPositives(distance, duration, cadence)
      ) {
        alert('Enter valid values ! ');
      }
      workout = new Running([lat, lng], distance, duration, cadence);
      workout.currentContent = ` 🏃‍♂️ Running on ${
        months[date.getMonth()]
      } ${date.getDate()}`;
    }

    // If workout is cycling, create cycling object
    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      // Checking if the input values are valid - guard clause
      if (
        !validInputs(distance, duration, elevation) ||
        !allPositives(distance, duration)
      ) {
        alert('Enter valid values ! ');
      }
      workout = new Cycling([lat, lng], distance, duration, elevation);
      workout.currentContent = ` 🚴‍♂️ Cycling on ${
        months[date.getMonth()]
      } ${date.getDate()}`;
    }

    // Add new object to the workout array
    this.#workouts.push(workout);

    // Render workout on the map
    this._renderWorkoutMarker(workout);

    // Render workout on the sidebar
    this._renderWorkout(workout);

    // Hide form  + clear the input fields
    this._hideForm();

    // Save the workouts in the Local Storage
    this._setLocalStorage();
  }

  _renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(workout.currentContent)
      .openPopup();
  }

  _renderWorkout(workout) {
    const html = `
      <li class="workout workout--${workout.type}" data-id='${workout.id}'>
        <h2 class="workout__title">${
          workout.type.charAt(0).toUpperCase() + workout.type.slice(1)
        } on April 14</h2>
        <div class="workout__details">
          <span class="workout__icon">${
            workout.type === 'running' ? '🏃‍♂️' : '🚴‍♂️'
          }</span>
          <span class="workout__value">${workout.distance}</span>
          <span class="workout__unit">km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⏱</span>
          <span class="workout__value">${workout.duration}</span>
          <span class="workout__unit">min</span>
        </div>
        <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${(workout.type === 'running'
              ? workout.pace
              : workout.speed
            ).toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
        </div>
        <div class="workout__details">
            <span class="workout__icon">${
              workout.type === 'running' ? '🦶' : '⛰'
            }</span>
            <span class="workout__value">${
              workout.type === 'running' ? workout.cadence : workout.elevGain
            }</span>
            <span class="workout__unit">spm</span>
        </div>
      </li>
        `;

    form.insertAdjacentHTML('afterend', html);
  }

  _moveToWorkout(e) {
    const workoutEl = e.target.closest('.workout');
    if (!workoutEl) return;

    const workout = this.#workouts.find(
      workObj => workObj.id === +workoutEl.dataset.id
    );

    this.#map.setView(workout.coords, this.#mapZoom + 0.5, {
      animate: true,
      pan: {
        duration: 1,
        easing: 'ease-in-out',
      },
    });
  }

  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));
    if (!data) return;

    // Restoring the data from local storage
    this.#workouts = data;

    // Render workouts on the sidebar
    this.#workouts.forEach(workoutObj => {
      this._renderWorkout(workoutObj);
    });
  }

  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}

const app = new App();

// /////////////////////////////// ADDITIONAL FEATURES
const deleteAllWorkouts = document.querySelector('.delete');
deleteAllWorkouts.style.display = 'none';
deleteAllWorkouts.addEventListener('click', function () {
  app.reset();
  // deleteAllWorkouts.style.display = 'none';
});
