let todoList = [];

function addtodo(event) {
    event.preventDefault(); // stop form submitting

    let inputElement = document.querySelector("#to-do-input");
    let todoItem = inputElement.value.trim();
    let warning = document.querySelector("#warning");
    let startDateElement = document.querySelector("#todo-start-date");
    let endDateElement = document.querySelector("#todo-end-date");
    let inputTime = document.querySelector("#todo-time");
    let todoTime = inputTime.value;

    if (todoItem === "") {
        warning.style.display = "block";
        return;
    } else {
        warning.style.display = "none";
    }

    if (todoTime === "") {
        todoTime = "No Time Set";
    }

    let startDate = startDateElement.value;
    let endDate = endDateElement.value;

    if (startDate === "" || endDate === "") {
        alert("Please select both start and end date!");
        return;
    }

    // add task
    todoList.push({ item: todoItem, StartDate: startDate, EndDate: endDate, DueTime: todoTime });
    inputElement.value = '';
    startDateElement.value = '';
    endDateElement.value = '';
    inputTime.value = '';
    displaytodo();

    // schedule reminders
    if (todoTime !== "No Time Set") {
        scheduleReminderRange(todoItem, startDate, endDate, todoTime);
    }
}

function removeExpiredTasks() {
    let today = new Date().toISOString().split("T")[0]; // current date (YYYY-MM-DD)

    // keep only tasks whose end date >= today
    todoList = todoList.filter(task => task.EndDate >= today);
     
    displaytodo();
     // refresh UI
}


function displaytodo() {
    
   let displayElement = document.querySelector("#to-do-item");
   let newHtml = '';
   for (let i = 0; i < todoList.length; i++) {
       let { item, StartDate, EndDate, DueTime } = todoList[i];

       newHtml += `<div class="task">
           <span>${i + 1}. ${item}</span>
           <span> ⏰ ${DueTime}</span>
           <span> 📅 ${StartDate} → ${EndDate}</span>
           <button onclick="todoList.splice(${i},1); displaytodo();">Task Done 👍</button>
       </div>`;
   }
   displayElement.innerHTML = newHtml;
}
setInterval(removeExpiredTasks, 86400000);

// 🔔 schedule reminders for a date range
function scheduleReminderRange(taskName, startDate, endDate, time) {
    let current = new Date(startDate);
    let last = new Date(endDate);

    while (current <= last) {
        let dateStr = current.toISOString().split("T")[0]; // format YYYY-MM-DD
        scheduleReminder(taskName, dateStr, time);
        current.setDate(current.getDate() + 1); // move to next day
    }
}

// 🔔 single reminder
function scheduleReminder(taskName, date, time) {
    let taskDateTime = new Date(`${date}T${time}`);
    let reminderTime = taskDateTime.getTime() - (2 * 60 * 1000); // 2 min before
    let now = Date.now();

    let timeUntilReminder = reminderTime - now;

    if (timeUntilReminder > 0) {
        setTimeout(() => {
            alert(`⏰ Reminder: "${taskName}" is due at ${time} on ${date} (in 2 minutes)!`);
        }, timeUntilReminder);
    } else {
        console.log("⏰ Too late to set reminder for:", taskName, "on", date);
    }
}
