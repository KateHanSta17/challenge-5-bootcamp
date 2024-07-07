// Retrieve tasks and nextId from localStorage
let taskList = JSON.parse(localStorage.getItem("tasks")) || [];
let nextId = JSON.parse(localStorage.getItem("nextId")) || 1;
let history = JSON.parse(localStorage.getItem("history")) || [];

// Function to generate a unique task id
function generateTaskId() {
  return nextId++;
}

// Function to create a task card
function createTaskCard(task) {
  const dueDate = dayjs(task.date);
  const today = dayjs();
  let cardColor = "";

  // Determine card color based on swimlane and due date
  if (task.status === "done") {
    cardColor = "border-success";
  } else {
    if (today.isAfter(dueDate)) {
      cardColor = "border-danger";
    } else if (today.isSame(dueDate, 'day') || today.isSame(dueDate.add(1, 'day'), 'day')) {
      cardColor = "border-warning";
    }
  }

  return `
    <div class="card mb-3 task-card ${cardColor}" data-id="${task.id}">
      <div class="card-header">
        <span>${task.title}</span>
        <button class="btn btn-sm btn-danger delete-task">Delete</button>
      </div>
      <div class="card-body">
        <p class="card-text">${task.desc}</p>
        <p class="card-text"><small class="text-muted">Due: ${dueDate.format('MMM D, YYYY')}</small></p>
      </div>
    </div>
  `;
}

// Function to render the task list and make cards draggable
function renderTaskList() {
  $('#todo-cards').empty();
  $('#in-progress-cards').empty();
  $('#done-cards').empty();

  taskList.forEach(task => {
    const taskCard = createTaskCard(task);
    $(`#${task.status}-cards`).append(taskCard);
  });

  $(".task-card").draggable({
    revert: "invalid",  // Ensure the card snaps back if dropped outside a valid drop target
    stack: ".task-card",
    helper: "clone",
    zIndex: 1000  // Ensure the dragged card has the highest z-index
  });

  $(".lane").droppable({
    accept: ".task-card",
    drop: handleDrop
  });

  $(".delete-task").on("click", handleDeleteTask);
}

// Function to handle adding a new task
function handleAddTask(event) {
  event.preventDefault();
  const title = $("#task-title").val();
  const desc = $("#task-desc").val();
  const date = $("#task-date").val();

  if (title && desc && date) {
    const newTask = {
      id: generateTaskId(),
      title: title,
      desc: desc,
      date: date,
      status: 'todo'
    };

    taskList.push(newTask);
    saveTasks();
    renderTaskList();

    $("#task-form")[0].reset();
    $('#formModal').modal('hide');
  }
}

// Function to handle deleting a task
function handleDeleteTask(event) {
  const taskId = $(event.target).closest('.task-card').data('id');
  const task = taskList.find(task => task.id === taskId);
  if (task) {
    history.push({ ...task, deleted: true });
    taskList = taskList.filter(task => task.id !== taskId);
    saveTasks();
    renderTaskList();
    console.log("Deleted task history:", history);
  }
}

// Function to handle dropping a task into a new status lane
function handleDrop(event, ui) {
  const taskId = ui.draggable.data('id');
  const newStatus = $(this).attr('id').replace('-cards', '');
  const dueDate = dayjs(taskList.find(task => task.id === taskId).date);
  const today = dayjs();

  taskList = taskList.map(task => {
    if (task.id === taskId) {
      if (newStatus === 'done') {
        ui.draggable.removeClass('border-danger border-warning').addClass('border-success');
      }
      else if (newStatus === 'in-progress' || 'to do') {
        if (today.isAfter(dueDate)) {
          ui.draggable.removeClass('border-success border-danger border-warning').addClass('border-danger');
        }
        else if (today.isSame(dueDate, 'day') || today.isSame(dueDate.add(1, 'day'), 'day')) {
          ui.draggable.removeClass('border-success border-danger border-warning').addClass('border-warning');
        }
      }
      return { ...task, status: newStatus };
    }
    return task;
  });

  saveTasks();
  renderTaskList();
}

// Function to save tasks to localStorage
function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(taskList));
  localStorage.setItem("nextId", JSON.stringify(nextId));
  localStorage.setItem("history", JSON.stringify(history));
}

// When the page loads, render the task list, add event listeners, make lanes droppable
$(document).ready(function () {
  renderTaskList();

  // Initialize date picker on modal show
  $('#formModal').on('shown.bs.modal', function () {
    $("#task-date").datepicker({
      dateFormat: "yy-mm-dd"
    });
  });

  $("#task-form").on("submit", handleAddTask);
});
