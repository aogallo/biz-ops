const NotFound = () => {
  return (
    <div className='flex flex-col items-center justify-between'>
      <h2 className='font-extrabold= mb-2 text-8xl'>404</h2>
      <h2 className='mb-2 text-2xl font-semibold text-gray-300'>
        Page Not Found
      </h2>
      <p className='text-gray-400'>
        Sorry, the page you are looking for does not exist.
      </p>
    </div>
  )
}

export default NotFound
