<script setup>
definePageMeta({ layout: false })

const { isLoggedIn } = useAuthClient()

onMounted(() => {
  navigateTo(isLoggedIn.value ? "/dashboard" : "/login")
})
</script>

<template>
  <div></div>
</template>
