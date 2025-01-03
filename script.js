$(function () {
    var tasks = [];
    var currentTaskIndex = 0;

    loadTasksFromLocalStorage();

    function loadTasksFromLocalStorage() {
        if (localStorage.getItem("tasks")) {
            tasks = JSON.parse(localStorage.getItem("tasks"));
            displayExistingTasks();
        }
    }

    function saveTasksToLocalStorage() {
        localStorage.setItem("tasks", JSON.stringify(tasks));
    }

    function updateTaskName(taskIndex) {
        var task = tasks[taskIndex];
        var uncompletedSubTasks = task.subTasks.filter(subTask => !subTask.completed).length;

        var taskItem = $(".task-item[data-task-index='" + taskIndex + "']");
        taskItem.html("<div style='display:flex'><i class='fas fa-bars'></i> " + task.name +
            (uncompletedSubTasks >= 0 ? "<div style='background: gray;color:white; border-radius:50px; font-size: 25px'; width:20px; margin-left:20px> " + uncompletedSubTasks + "</div>" : "") +
            "<a href='#' class='remove'><i class='fa-sharp fa-solid fa-trash'></i></a></div>");

        taskItem.find(".remove").on("click", function (event) {
            event.preventDefault();

            var taskIndex = $(this).closest(".task-item").data("task-index");
            tasks[taskIndex].showTrashIcon = false;
            tasks.splice(taskIndex, 1);
            $(this).closest(".task-item").remove();
            switchToPreviousTask();
            saveTasksToLocalStorage();
        });

        taskItem.on("click", function () {
            var taskIndex = $(this).data("task-index");
            currentTaskIndex = taskIndex;
            selectTask(taskIndex);
        });
    }

    function displayExistingTasks() {
        tasks.forEach(function (task, index) {
            var trashIconVisibility = task.showTrashIcon ? "visible" : "hidden";
            $("#added").append("<li class='task-item' data-task-index='" + index + "'>" +
                "<i class='fas fa-bars'></i> " + task.name +
                "<a href='#' class='remove' style='visibility:" + trashIconVisibility + "'><i class='fa-sharp fa-solid fa-trash'></i></a></li>");
        });

        $("#added").on("click", ".task-item", function () {
            var taskIndex = $(this).data("task-index");
            currentTaskIndex = taskIndex;
            selectTask(taskIndex);
        });

        $("#added").on("click", ".remove", function (event) {
            event.preventDefault();

            var taskIndex = $(this).closest(".task-item").data("task-index");
            tasks[taskIndex].showTrashIcon = false; 
            tasks.splice(taskIndex, 1);
            $(this).closest(".task-item").remove();
            switchToPreviousTask();
            saveTasksToLocalStorage();
        });
    }

    $("#newlist a").on("click", function () {
        $("body").addClass("overlay");
        $("#blur").css({
            "visibility": "visible",
            "position": "absolute",
            "width": "100%",
            "height": "100%",
            "background": "rgba(0, 0, 0, 0.3)"
        });
        $("#overlay").fadeIn(300);
        $("#new-task-name").focus();
    });

    $("#cancel-task").on("click", function () {
        clearInputAndHideModal();
    });

    $(document).mouseup(function (e) {
        var container = $("#dialog-box");
        if (!container.is(e.target) && container.has(e.target).length === 0) {
            clearInputAndHideModal();
        }
    });

    $("#create-task").on("click", function () {
        createNewTask();
    });

    $("#new-task-name").on("keydown", function (e) {
        if (e.key === "Enter") {
            createNewTask();
        }
    });

    function selectTask(index) {
        if (index >= 0 && index < tasks.length) {
            displayTaskDetails(tasks[index]);
        }
    }

    function displayTaskDetails(task) {
        var newContent = "<div id='right' style='background: linear-gradient(180deg, rgba(2,0,36,1) 0%, rgba(9,9,121,1) 0%, rgba(0,212,255,1) 50%);height:100vh'>" +
            "<div class='title'><h1 id='new-task-title'>" +
            task.name + "</h1></div><div id='team'></div>" +
            "<div id='sub-tasks'></div>" +
            "<div><label for='add-task-input'></label>" +
            "<input type='text' placeholder='New Task'id='add-task-input'></div>" +
            "</div>";

        $("#right").replaceWith(newContent);

        $("#add-task-input").on("keydown", function (e) {
            if (e.key === "Enter") {
                addSubTask(task);
            }
        });

        task.subTasks.forEach(function (subTask, index) {
            var checkbox = $("<input type='checkbox' class='sub-task-checkbox'/>")
                .prop("checked", subTask.completed)
                .on("change", function () {
                    subTask.completed = $(this).prop("checked");
                    updateTaskName(currentTaskIndex);
                });

            var label = $("<label>").text(subTask.name);

            if (subTask.completed) {
                label.css("text-decoration", "line-through");
            }

            $("#sub-tasks").append(
                $("<div class='sub-task'>").append(checkbox, label)
            );
        });

        $("#add-task-input").focus();
    }

    $(document).on("change", ".sub-task-checkbox", crossed);

    function crossed() {
        var checkbox = $(this);

        var subTaskElement = checkbox.closest(".sub-task");

        var label = subTaskElement.find("label");

        if (checkbox.prop("checked")) {
            label.css("text-decoration", "line-through");
        } else {
            label.css("text-decoration", "none");
        }
    }

    function addSubTask(parentTask) {
        var subTaskName = $("#add-task-input").val();
        if (subTaskName.trim() !== "") {
            var newSubTask = {
                name: subTaskName,
                completed: false
            };

            parentTask.subTasks.push(newSubTask);

            $("#sub-tasks").append(
                "<div class='sub-task'>" +
                "<input type='checkbox' class='sub-task-checkbox'/>" +
                "<label>" + subTaskName + "</label>" +
                "</div>"
            );

            $("#sub-tasks .sub-task-checkbox:last").on("change", function () {
                var checkboxIndex = $(this).closest(".sub-task").index();
                parentTask.subTasks[checkboxIndex].completed = $(this).prop("checked");
                updateTaskName(currentTaskIndex);
            });

            updateTaskName(currentTaskIndex);

            tasks.forEach(function (task, index) {
                updateTaskName(index);
            });

            updateTaskName(currentTaskIndex);
            $("#add-task-input").val("");
            saveTasksToLocalStorage();
        }
    }

    function switchToNextTask() {
        if (tasks.length > 0) {
            currentTaskIndex = (currentTaskIndex + 1) % tasks.length;
            selectTask(currentTaskIndex);
        }
    }

    var initialRightContent = $("#right").html();

    function switchToPreviousTask() {
        if (tasks.length > 0) {
            currentTaskIndex = (currentTaskIndex - 1 + tasks.length) % tasks.length;
            selectTask(currentTaskIndex);
        } else {
            $("#right").html(initialRightContent);
        }
    }

    $(document).keydown(function (e) {
        if (e.key === "ArrowRight") {
            switchToNextTask();
        } else if (e.key === "ArrowLeft") {
            switchToPreviousTask();
        }
    });

    function createNewTask() {
        var taskName = $("#new-task-name").val();
        if (taskName.trim() !== "") {
            var newTask = {
                name: taskName,
                subTasks: [],
                showTrashIcon: true
            };

            tasks.push(newTask);

            saveTasksToLocalStorage();

            $("#added").append("<li class='task-item' data-task-index='" + (tasks.length - 1) + "'>" +
                "<i class='fas fa-bars'></i> " + taskName +
                "<a href='#' class='remove' style='visibility: visible'><i class='fa-sharp fa-solid fa-trash'></i></a></li>");

            $(document).on("mouseenter", ".task-item", function () {
                $(this).find(".fa-sharp").css("visibility", "visible");
            });

            $(document).on("mouseleave", ".task-item", function () {
                $(this).find(".fa-sharp").css("visibility", "hidden");
            });

            $(document).on("mouseenter", ".task-item", function () {
                $(this).find(".button_trash").css("visibility", "visible");
            });

            $(document).on("mouseleave", ".task-item", function () {
                $(this).find(".button_trash").css("visibility", "hidden");
            });

            displayTaskDetails(newTask);

            $(document).on("click", ".remove", function (event) {
                event.preventDefault();

                var taskIndex = $(this).closest(".task-item").data("task-index");
                tasks[taskIndex].showTrashIcon = false;
                tasks.splice(taskIndex, 1);
                $(this).closest(".task-item").remove();
                switchToPreviousTask();
                saveTasksToLocalStorage();
            });

            $(".task-item").on("click", function () {
                var taskIndex = $(this).data("task-index");
                currentTaskIndex = taskIndex;
                selectTask(taskIndex);
            });

            displayTaskDetails(newTask);

            clearInputAndHideModal();
        } else {
            alert("Task name cannot be empty");
        }
    }

    $(document).on("click", ".button_trash", function () {
        var taskIndex = $(this).closest(".task-item").data("task-index");

        tasks[taskIndex].showTrashIcon = false;
        tasks.splice(taskIndex, 1);

        $(this).closest(".task-item").remove();
        saveTasksToLocalStorage();
    });

    function clearInputAndHideModal() {
        localStorage.removeItem("tasks");
        $("#new-task-name").val("");
        $("body").removeClass("overlay");
        $("#overlay").fadeOut(300);
        $("#blur").css("visibility", "hidden");
    }
});
