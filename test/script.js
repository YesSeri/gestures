const select = document.querySelector("select")
console.log(select);

for (const option of select) {
    if (option.selected === true) {
        console.log(option);

    }
}
