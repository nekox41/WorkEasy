// App.vue
<template>
  <div class="userscript-app">
    <Image v-if="imageHref" :src="imageHref" />
  </div>
</template>

<script>
export default {
  name: 'App',
  props: {
    imageHref: {
      type: String,
      default: null
    }
  }
}
</script>