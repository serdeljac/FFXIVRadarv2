<template>
    <aside class="sidebar">
        <div class="wrapper">
            <p>OPEN</p>
        </div>
    </aside>
</template>

<script lang="ts">
    export default {
        name: 'Sidebar',
    }
</script>

<style scoped lang="scss">
    .sidebar {
        .wrapper {
            padding: $paddingSize;
        }
        
        background: red;
    }


</style>