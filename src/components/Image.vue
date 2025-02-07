<template>
  <div>
    <iframe 
      v-if="!error" 
      :src="src" 
      width="100%" 
      height="500px" 
      frameborder="0"
      @load="onLoad"
      @error="onError"
    ></iframe>
    <div v-else class="error-message">
      Failed to load content
    </div>
  </div>
</template>

<script>
export default {
  name: 'Image',
  props: {
    src: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      error: false
    }
  },
  methods: {
    onLoad() {
      this.error = false
    },
    onError() {
      this.error = true
    }
  }
}
</script>