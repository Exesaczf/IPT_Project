// Utility functions for localStorage
function getData(key) {
    return JSON.parse(localStorage.getItem(key)) || [];
}

function setData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

function removeData(key) {
    localStorage.removeItem(key);
}

// Category-related functions
// Adding a category
function addCategory() {
    const categoryInput = document.getElementById("new-category").value;
    if (!categoryInput) return alert("Category name cannot be empty");

    let categories = getData("categories");
    categories.push(categoryInput);
    setData("categories", categories);
    renderCategories(); // Call this to update the category list immediately
    document.getElementById("new-category").value = ""; // Clear input field
}

// Rendering categories in the list and dropdown
function renderCategories() {
    const categoryList = document.getElementById("category-list");
    const categoryDropdown = document.getElementById("category-dropdown");
    categoryList.innerHTML = ""; // Clear the list before re-rendering
    categoryDropdown.innerHTML = ""; // Clear dropdown too

    let categories = getData("categories");

    categories.forEach((category, index) => {
        // Add each category as a list item with a delete button
        categoryList.innerHTML += `
            <li>
                ${category} 
                <button class="delete" onclick="deleteCategory(${index})">Delete</button>
            </li>`;
        
        // Also add it to the dropdown
        categoryDropdown.innerHTML += `<option value="${category}">${category}</option>`;
    });
}

// Deleting a category
function deleteCategory(index) {
    if (confirm("Are you sure you want to delete this category?")) {
        let categories = getData("categories");
        categories.splice(index, 1);
        setData("categories", categories);
        renderCategories();
    }
}

// Task-related functions
// Adding a task
function addTask() {
    const taskInput = document.getElementById("new-task").value;
    const dueDate = document.getElementById("task-due-date").value;
    const selectedCategories = Array.from(document.getElementById("category-dropdown").selectedOptions).map(opt => opt.value);

    if (!taskInput) return alert("Task name cannot be empty");
    if (selectedCategories.length === 0) { return alert("Please select at least one category"); }

    let tasks = getData("tasks");
    tasks.push({
        name: taskInput,
        dueDate: dueDate,
        categories: selectedCategories,
        completed: false
    });

    setData("tasks", tasks);
    renderTasks();
    document.getElementById("new-task").value = ""; 
    document.getElementById("task-due-date").value = "";

    alert(`Task: "${taskInput}" added successfully!`);
}

// Rendering tasks
function renderTasks() {
    const taskList = document.getElementById("task-list");
    taskList.innerHTML = "";

    let tasks = getData("tasks");

    // Sort tasks, showing completed ones at the bottom

    tasks.forEach((task, index) => {
        const isCompleted = task.completed ? 'checked' : '';
        const textDecoration = task.completed ? 'line-through' : 'none'; // Line-through if completed
        const backgroundColor = task.completed ? '#f8d7da' : '#f9f9f9'; // Light red if completed
        const disabledEdit = task.completed ? 'disabled' : ''; // Disable edit button if completed

        // Render each task item with appropriate styles
        taskList.innerHTML += `
            <li style="background-color: ${backgroundColor};">
                <span style="text-decoration: ${textDecoration};">
                    <input type="checkbox" ${isCompleted} onchange="toggleTaskCompletion(${index})">
                    ${task.name} | Due: ${task.dueDate} | Categories: ${task.categories.join(", ")}
                </span>    
                <button style="padding: 0;" onclick="deleteTask(${index})">Delete</button>
                <button style="padding: 5px 10px; text-decoration: ${textDecoration};" onclick="editTask(${index})" ${disabledEdit}>Edit</button>
            </li>`;
    });
}

function deleteTask(index) {
    if (confirm("Are you sure you want to delete this task?")) {
        let tasks = getData("tasks");
        tasks.splice(index, 1);
        setData("tasks", tasks);
        renderTasks();
        
    }
}

function toggleTaskCompletion(index) {
    let tasks = getData("tasks");
    
    // Toggle the completion status
    tasks[index].completed = !tasks[index].completed; 

    // Split tasks into completed and not completed
    const completedTasks = tasks.filter(task => task.completed);
    const incompleteTasks = tasks.filter(task => !task.completed);

    // Concatenate the incomplete tasks followed by the completed tasks
    const sortedTasks = [...incompleteTasks, ...completedTasks];

    setData("tasks", sortedTasks); // Save updated tasks to localStorage
    renderTasks(); // Re-render tasks to reflect changes
    renderAnalytics(); // Update analytics after task completion status change
}



// Editing a task
function editTask(index) {
    let tasks = getData("tasks");
    const task = tasks[index];
    const editCategoryDropdown = document.getElementById("edit-category-dropdown");
    editCategoryDropdown.innerHTML = ""; // Clear dropdown first

    const categories = getData("categories");
    categories.forEach(category => {
        const option = document.createElement("option");
        option.value = category;
        option.textContent = category;
        if (task.categories.includes(category)) {
            option.selected = true;
        }
        editCategoryDropdown.appendChild(option);
    });

    document.getElementById("edit-task-name").value = task.name;
    document.getElementById("edit-task-due-date").value = task.dueDate;

    editTaskIndex = index; // Store the index for editing
    document.getElementById("editModal").style.display = "block"; // Show modal
}

// Closing the modal
function closeModal() {
    document.getElementById("editModal").style.display = "none"; // Hide the modal
}

function saveEdit() {
    if (!confirm("Are you sure you want to update this task?")) {
        return; // If the user clicks 'Cancel', stop the function
    }

    const index = editTaskIndex; 
    const newName = document.getElementById("edit-task-name").value;
    const newDueDate = document.getElementById("edit-task-due-date").value;
    const newCategories = Array.from(document.getElementById("edit-category-dropdown").selectedOptions).map(opt => opt.value);

    let tasks = getData("tasks");
    if (newName) tasks[index].name = newName;
    if (newDueDate) tasks[index].dueDate = newDueDate;
    if (newCategories.length > 0) tasks[index].categories = newCategories;

    setData("tasks", tasks);
    renderTasks();
    closeModal();
}

function getCategoryColor(index) {
    const colors = [
        'rgba(255, 99, 132, 0.6)',  // Red
        'rgba(255, 206, 86, 0.6)',  // Yellow
        'rgba(54, 162, 235, 0.6)',  // Blue
        'rgba(153, 102, 255, 0.6)', // Purple
        'rgba(255, 159, 64, 0.6)',  // Orange
        'rgba(199, 199, 199, 0.6)', // Grey
        'rgba(233, 30, 99, 0.6)',   // Pink
        'rgba(63, 81, 181, 0.6)',   // Indigo
        'rgba(0, 188, 212, 0.6)'    // Cyan
    ];

    // If there are more categories than colors, assign colors cyclically
    return colors[index % colors.length];   
}

// Analytics-related functions

let analyticsChart = null; // Global variable to hold the Chart instance

// Function to retrieve stored data (tasks, categories, etc.)
function getData(key) {
    return JSON.parse(localStorage.getItem(key)) || [];
}

// Here is the updated renderAnalytics function
function renderAnalytics() {
    const tasks = getData("tasks");
    const categories = getData("categories");

    // Calculate the overall completion rate
    let totalTasks = tasks.length;
    let completedTasks = tasks.filter(task => task.completed).length;
    let overallCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Create category completion data
    let categoryCompletion = categories.map((category, index) => {
        let categoryTasks = tasks.filter(task => task.categories.includes(category));
        let completedCategoryTasks = categoryTasks.filter(task => task.completed);
        return {
            category: category,
            completionRate: categoryTasks.length > 0 ? (completedCategoryTasks.length / categoryTasks.length) * 100 : 0,
            color: getCategoryColor(index)
        };
    });

    // Insert the "Overall" completion rate at the beginning
    categoryCompletion.unshift({
        category: "Overall",
        completionRate: overallCompletionRate,
        color: 'rgba(75, 192, 192, 0.6)' 
    });

    // Update the chart data
    const ctx = document.getElementById('analytics-chart').getContext('2d');

    if (analyticsChart) {
        analyticsChart.data.labels = categoryCompletion.map(item => item.category);
        analyticsChart.data.datasets[0].data = categoryCompletion.map(item => item.completionRate);
        analyticsChart.data.datasets[0].backgroundColor = categoryCompletion.map(item => item.color);
        analyticsChart.data.datasets[0].borderColor = categoryCompletion.map(item => item.color.replace('0.6', '1'));

        // Update the chart to reflect new data
        analyticsChart.update();
    } else {
        // If the chart doesn't exist, create it
        analyticsChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: categoryCompletion.map(item => item.category),
                datasets: [{
                    label: 'Completion Rate (%)',
                    data: categoryCompletion.map(item => item.completionRate),
                    backgroundColor: categoryCompletion.map(item => item.color),
                    borderColor: categoryCompletion.map(item => item.color.replace('0.6', '1')),
                    borderWidth: 2
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            stepSize: 20,
                            callback: function(value) {
                                return value + "%";
                            }
                        },
                        grid: {
                            drawTicks: true,
                            color: 'rgba(0, 0, 0, 0.1)',
                            lineWidth: 1,
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                return context.raw.toFixed(2) + "%";
                            }
                        }
                    }
                }
            }
        });
    }

    // Update the category completion list
    const categoryList = document.getElementById("category-completion-list");
    categoryList.innerHTML = "";

    categoryCompletion.forEach(item => {
        categoryList.innerHTML += `<ul>${item.category}: ${item.completionRate.toFixed(2)}%</ul>`;
    });
}


// Initial rendering when the page loads
window.onload = function() {
    renderCategories(); // Render categories
    renderTasks(); // Render tasks
    renderAnalytics(); // Render the analytics chart
}